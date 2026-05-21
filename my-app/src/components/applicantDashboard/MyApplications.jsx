import "./Dashboard.css";
import "./MyApplications.css";

import { useEffect, useState, useRef } from "react";
import {
  collection,
  doc,
  query,
  where,
  getDoc,
  onSnapshot,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./MyApplications.css";

// ─── constants ───────────────────────────────────────────────────────────────

const stages = ["Submitted", "Received", "Under Evaluation", "Final Decision"];

const STATUS_MESSAGES = {
  Received:           "Your application has been received and is under review.",
  Pending:            "Your application is pending review.",
  "Under evaluation": "Your application is currently being evaluated.",
  Shortlisted:        "Great news! You have been shortlisted.",
  Accepted:           "Congratulations! Your application has been accepted.",
  Rejected:           "Unfortunately your application was not successful this time.",
};

const STATUS_COLORS = {
  Submitted:          { color: "#a1a1aa", bg: "rgba(161,161,170,0.12)" },
  Received:           { color: "#4a9eff", bg: "rgba(74,158,255,0.12)"  },
  Pending:            { color: "#4a9eff", bg: "rgba(74,158,255,0.12)"  },
  "Under evaluation": { color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  Shortlisted:        { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  Accepted:           { color: "#2ecc71", bg: "rgba(46,204,113,0.12)"  },
  Rejected:           { color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function normalizeStatus(status = "") {
  if (!status) return "";
  const lower = status.toLowerCase();
  if (lower === "under evaluation") return "Under evaluation";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function getStageIndex(status) {
  switch (normalizeStatus(status)) {
    case "Submitted":        return 0;
    case "Received":         return 1;
    case "Pending":          return 1;
    case "Under evaluation": return 2;
    case "Shortlisted":      return 3;
    case "Accepted":         return 3;
    case "Rejected":         return 3;
    default:                 return 0;
  }
}

// ─── ProgressTracker ─────────────────────────────────────────────────────────

function ProgressTracker({ status = "" }) {
  const normalized    = normalizeStatus(status);
  const stageIndex    = getStageIndex(status);
  const isAccepted    = normalized === "Accepted";
  const isRejected    = normalized === "Rejected";
  const isShortlisted = normalized === "Shortlisted";

  return (
    <ol className="progress-tracker">
      {stages.map((stage, index) => {
        const isActive        = index <= stageIndex;
        const isFinalDecision = stage === "Final Decision";

        const label = isFinalDecision
          ? isAccepted    ? "Accepted"
          : isRejected    ? "Rejected"
          : isShortlisted ? "Shortlisted"
          : "Final Decision"
          : stage === "Received" && normalized === "Pending"
          ? "Pending"
          : stage;

        const dotClass = [
          "progress-tracker__dot",
          isActive ? "progress-tracker__dot--active" : "",
          isFinalDecision && isAccepted    ? "progress-tracker__dot--accepted"    : "",
          isFinalDecision && isRejected    ? "progress-tracker__dot--rejected"    : "",
          isFinalDecision && isShortlisted ? "progress-tracker__dot--shortlisted" : "",
        ].filter(Boolean).join(" ");

        return (
          <li
            key={index}
            className={["progress-tracker__step", isActive ? "progress-tracker__step--active" : ""].filter(Boolean).join(" ")}
          >
            <span className={dotClass} aria-hidden="true" />
            <span className={["progress-tracker__label", isActive ? "progress-tracker__label--active" : ""].filter(Boolean).join(" ")}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ─── ApplicationDetailModal (read-only) ──────────────────────────────────────

function ApplicationDetailModal({ application, onClose }) {
  const normalized  = normalizeStatus(application.status);
  const statusStyle = STATUS_COLORS[normalized] || STATUS_COLORS.Submitted;
  const message     = STATUS_MESSAGES[normalized];
  const appliedAt   = application.appliedAt
    ? application.appliedAt.toDate().toLocaleDateString("en-ZA", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  return (
    <aside className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Application detail">
      <article className="app-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <header className="app-modal-status-row">
          <span
            className="app-modal-status-badge"
            style={{ color: statusStyle.color, background: statusStyle.bg }}
          >
            {normalized || "Submitted"}
          </span>
          {appliedAt && <time className="app-modal-date">Applied {appliedAt}</time>}
        </header>

        <h2 className="app-modal-title">{application.title}</h2>
        <p className="app-modal-company">{application.company}</p>

        {message && (
          <aside className="app-modal-message">
            <span className="app-modal-message-icon" aria-hidden="true">ℹ️</span>
            <p>{message}</p>
          </aside>
        )}

        <section className="app-modal-tracker-wrap">
          <h3 className="app-modal-section-title">Application Progress</h3>
          <ProgressTracker status={application.status} />
        </section>

        <p className="app-modal-readonly-note">🔒 Applications cannot be edited after submission.</p>

        <footer className="app-modal-footer">
          <button className="modal-btn modal-btn--primary" onClick={onClose}>Close</button>
        </footer>
      </article>
    </aside>
  );
}

// ─── Sort / Filter options ───────────────────────────────────────────────────

const APP_SORT_OPTIONS = [
  { value: "date_desc", label: "Most Recent"  },
  { value: "date_asc",  label: "Oldest First" },
  { value: "alpha_asc", label: "A → Z"        },
  { value: "status",    label: "By Status"    },
];

const STATUS_FILTERS = [
  "All", "Submitted", "Received", "Under Evaluation",
  "Shortlisted", "Accepted", "Rejected",
];

// ─── Main component ──────────────────────────────────────────────────────────

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [userName, setUserName]         = useState("");
  const [selectedApp, setSelectedApp]   = useState(null);
  const prevApplicationsRef             = useRef([]);

  const [sortBy, setSortBy]             = useState("date_desc");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery]   = useState("");

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) { setApplications([]); return; }

      const q = query(collection(db, "applications"), where("userId", "==", user.uid));

      unsubscribeSnapshot = onSnapshot(q, async (snapshot) => {
        const apps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        for (const app of apps) {
          const prev          = prevApplicationsRef.current.find((p) => p.id === app.id);
          const statusChanged = prev && normalizeStatus(prev.status) !== normalizeStatus(app.status);
          const hasMessage    = STATUS_MESSAGES[normalizeStatus(app.status)];

          if (statusChanged && hasMessage) {
            try {
              await addDoc(collection(db, "notifications"), {
                userId:        user.uid,
                title:         `Application ${normalizeStatus(app.status)}`,
                body:          `${app.title}: ${hasMessage}`,
                read:          false,
                type:          "status_update",
                applicationId: app.id,
                createdAt:     Timestamp.now(),
              });
            } catch (err) { console.error("Failed to write notification:", err); }
          }
        }

        prevApplicationsRef.current = apps;
        setApplications(apps);
      }, (err) => console.error("Snapshot error:", err));

      const userSnap = await getDoc(doc(db, "applicants", user.uid));
      if (userSnap.exists()) setUserName(userSnap.data().name || "User");
    });

    return () => { unsubscribeAuth(); if (unsubscribeSnapshot) unsubscribeSnapshot(); };
  }, []);

  const visibleApplications = (() => {
    let list = [...applications];

    if (statusFilter !== "All")
      list = list.filter((a) => normalizeStatus(a.status).toLowerCase() === statusFilter.toLowerCase());

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) => (a.title || "").toLowerCase().includes(q) || (a.company || "").toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case "date_asc":
        list.sort((a, b) => (a.appliedAt?.toMillis?.() ?? 0) - (b.appliedAt?.toMillis?.() ?? 0));
        break;
      case "alpha_asc":
        list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "status":
        list.sort((a, b) => (normalizeStatus(a.status) || "").localeCompare(normalizeStatus(b.status) || ""));
        break;
      default:
        list.sort((a, b) => (b.appliedAt?.toMillis?.() ?? 0) - (a.appliedAt?.toMillis?.() ?? 0));
    }

    return list;
  })();

  return (
    <section className="applications-page">
      <header className="applications-header">
        <p className="eyebrow">Career Dashboard</p>
        <h1 className="applications-title">My Applications</h1>
        <h2 className="applications-subtitle">Welcome back, {userName}</h2>
      </header>

      {/* ── Filter / Sort bar ── */}
      {applications.length > 0 && (
        <search className="app-filter-bar">
          <label className="filter-bar__search-wrap">
            <span className="filter-bar__search-icon" aria-hidden="true">🔍</span>
            <input
              className="filter-bar__search"
              type="search"
              placeholder="Search applications…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search your applications"
            />
            {searchQuery && (
              <button className="filter-bar__clear" onClick={() => setSearchQuery("")} aria-label="Clear search">✕</button>
            )}
          </label>

          <nav className="filter-bar__pills" aria-label="Filter by status">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                className={`filter-pill ${statusFilter === s ? "filter-pill--active" : ""}`}
                onClick={() => setStatusFilter(s)}
                aria-pressed={statusFilter === s}
              >
                {s}
              </button>
            ))}
          </nav>

          <select
            className="filter-bar__select filter-bar__select--sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort applications"
          >
            {APP_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <span className="filter-bar__count" aria-live="polite">
            {visibleApplications.length}{" "}
            {visibleApplications.length === 1 ? "application" : "applications"}
          </span>
        </search>
      )}

      {/* ── Grid ── */}
      <section className="applications-grid">
        {applications.length === 0 && (
          <p className="applications-empty">You have not applied to any opportunities yet.</p>
        )}
        {visibleApplications.length === 0 && applications.length > 0 && (
          <p className="applications-empty">No applications match your filters.</p>
        )}

        {visibleApplications.map((application) => {
          const normalized  = normalizeStatus(application.status);
          const statusStyle = STATUS_COLORS[normalized] || STATUS_COLORS.Submitted;
          const appliedAt   = application.appliedAt
            ? application.appliedAt.toDate().toLocaleDateString("en-ZA", {
                year: "numeric", month: "short", day: "numeric",
              })
            : null;

          return (
            <article
              key={application.id}
              className="application-card application-card--clickable"
              onClick={() => setSelectedApp(application)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedApp(application)}
              aria-label={`View details for ${application.title}`}
            >
              <header className="application-card__header">
                <h3 className="application-card__title">{application.title}</h3>
                <span
                  className="application-card__status-badge"
                  style={{ color: statusStyle.color, background: statusStyle.bg }}
                >
                  {normalized || "Submitted"}
                </span>
              </header>

              <section className="application-card__meta">
                <p className="application-card__company">{application.company}</p>
                {appliedAt && <time className="application-card__date">Applied {appliedAt}</time>}
              </section>

              <ProgressTracker status={application.status} />
              <p className="application-card__cta">Click to view details →</p>
            </article>
          );
        })}
      </section>

      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </section>
  );
}

export default MyApplications;