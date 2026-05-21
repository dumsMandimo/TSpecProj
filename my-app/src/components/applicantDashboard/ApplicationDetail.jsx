import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
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

// ─── Main component ──────────────────────────────────────────────────────────

export default function ApplicationDetail() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "applications", applicationId)).then(snap => {
      if (snap.exists()) {
        setApp({ id: snap.id, ...snap.data() });
      } else {
        setNotFound(true);
      }
    });
  }, [applicationId]);

  if (notFound) return (
    <section style={{ color: "#fff", padding: "2rem", textAlign: "center" }}>
      <p>Application not found.</p>
      <button className="modal-btn modal-btn--secondary" style={{ marginTop: "1rem" }} onClick={() => navigate(-1)}>
        Go Back
      </button>
    </section>
  );

  if (!app) return <p style={{ color: "#fff", padding: "2rem" }}>Loading…</p>;

  const normalized  = normalizeStatus(app.status);
  const statusStyle = STATUS_COLORS[normalized] || STATUS_COLORS.Submitted;
  const message     = STATUS_MESSAGES[normalized];
  const appliedAt   = app.appliedAt
    ? app.appliedAt.toDate().toLocaleDateString("en-ZA", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  return (
    <section className="applications-page">
      <article className="app-modal-sheet" style={{ margin: "2rem auto" }}>
        <button className="modal-close" onClick={() => navigate(-1)} aria-label="Go back">✕</button>

        <header className="app-modal-status-row">
          <span
            className="app-modal-status-badge"
            style={{ color: statusStyle.color, background: statusStyle.bg }}
          >
            {normalized || "Submitted"}
          </span>
          {appliedAt && <time className="app-modal-date">Applied {appliedAt}</time>}
        </header>

        <h2 className="app-modal-title">{app.title}</h2>
        <p className="app-modal-company">{app.company}</p>

        {message && (
          <aside className="app-modal-message">
            <span className="app-modal-message-icon" aria-hidden="true">ℹ️</span>
            <p>{message}</p>
          </aside>
        )}

        <section className="app-modal-tracker-wrap">
          <h3 className="app-modal-section-title">Application Progress</h3>
          <ProgressTracker status={app.status} />
        </section>

        <p className="app-modal-readonly-note">🔒 Applications cannot be edited after submission.</p>

        <footer className="app-modal-footer">
          <button className="modal-btn modal-btn--secondary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </footer>
      </article>
    </section>
  );
}