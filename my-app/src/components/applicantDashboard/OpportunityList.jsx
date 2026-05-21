import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./OpportunityList.css";

// ─── helpers ────────────────────────────────────────────────────────────────

function normalizeText(value) {
  return String(value || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function normalizeList(values) {
  if (Array.isArray(values)) return values.map(normalizeText).filter(Boolean);
  if (typeof values === "string" && values.trim())
    return values.split(",").map(normalizeText).filter(Boolean);
  return [];
}

function getApplicantNqfLevel(applicant) {
  if (!applicant) return null;
  if (typeof applicant.nqfLevel === "number") return applicant.nqfLevel;
  const match = String(applicant.qualification || "").match(/NQF\s*(?:Level\s*)?(\d+)/i);
  return match ? Number(match[1]) : null;
}

function getMatchDetails(applicant, opportunity) {
  if (!applicant)
    return {
      score: 0,
      label: "Login to check match",
      className: "neutral",
      matchedRequiredSkills: [],
      missingRequiredSkills: [],
      matchedPreferredSkills: [],
      reasons: [],
    };

  let score = 0;
  const reasons = [];

  const applicantNqfLevel = getApplicantNqfLevel(applicant);
  const minimumNqfLevel = opportunity.minimumNqfLevel ? Number(opportunity.minimumNqfLevel) : null;

  const applicantSkills  = normalizeList(applicant.normalizedSkills || applicant.skills || applicant.skillsText);
  const requiredSkills   = normalizeList(opportunity.normalizedRequiredSkills || opportunity.requiredSkills || opportunity.requiredSkillsText);
  const preferredSkills  = normalizeList(opportunity.normalizedPreferredSkills || opportunity.preferredSkills || opportunity.preferredSkillsText);

  const matchedRequiredSkills  = requiredSkills.filter((s) => applicantSkills.includes(s));
  const missingRequiredSkills  = requiredSkills.filter((s) => !applicantSkills.includes(s));
  const matchedPreferredSkills = preferredSkills.filter((s) => applicantSkills.includes(s));

  if (applicant.sector && opportunity.sector && applicant.sector === opportunity.sector) {
    score += 30; reasons.push("Sector match");
  }
  if (minimumNqfLevel && applicantNqfLevel) {
    if (applicantNqfLevel >= minimumNqfLevel) { score += 25; reasons.push(`Meets minimum NQF ${minimumNqfLevel}`); }
    else { score -= 20; reasons.push(`Below minimum NQF ${minimumNqfLevel}`); }
  }
  if (opportunity.preferredLearningArea &&
    (applicant.saqaLearningArea === opportunity.preferredLearningArea ||
      applicant.learningSubfield === opportunity.preferredLearningArea)) {
    score += 20; reasons.push("Learning area match");
  }
  if (opportunity.requiredQualificationId && applicant.saqaQualificationId) {
    if (opportunity.requiredQualificationId === applicant.saqaQualificationId) { score += 25; reasons.push("Specific qualification match"); }
  } else if (
    opportunity.requiredQualificationTitle && applicant.qualificationTitle &&
    normalizeText(opportunity.requiredQualificationTitle) === normalizeText(applicant.qualificationTitle)
  ) { score += 20; reasons.push("Specific qualification match"); }

  if (requiredSkills.length > 0) {
    score += matchedRequiredSkills.length * 10;
    if (matchedRequiredSkills.length === requiredSkills.length) { score += 15; reasons.push("All required skills matched"); }
    else if (matchedRequiredSkills.length > 0) { reasons.push(`${matchedRequiredSkills.length}/${requiredSkills.length} required skills matched`); }
    else { reasons.push("Required skills missing"); }
  }
  if (preferredSkills.length > 0 && matchedPreferredSkills.length > 0) {
    score += matchedPreferredSkills.length * 5;
    reasons.push(`${matchedPreferredSkills.length} preferred skill match`);
  }

  let label = "Partial match", className = "partial";
  if (score >= 80) { label = "Strong match"; className = "strong"; }
  else if (score >= 50) { label = "Good match"; className = "good"; }
  else if (minimumNqfLevel && applicantNqfLevel && applicantNqfLevel < minimumNqfLevel) { label = "Below NQF requirement"; className = "low"; }
  else if (score < 25) { label = "Low match"; className = "low"; }

  return { score, label, className, matchedRequiredSkills, missingRequiredSkills, matchedPreferredSkills, reasons };
}

// ─── Opportunity Detail Modal ────────────────────────────────────────────────

function OpportunityDetailModal({ opportunity, onClose, onApply, alreadyApplied }) {
  return (
    <aside className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={opportunity.title}>
      <article className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Badge row */}
        <header className="modal-badges">
          {opportunity.type && (
            <span className="opp-badge opp-badge--type">{opportunity.type}</span>
          )}
          <span className={`opp-badge opp-badge--match opp-badge--${opportunity.match.className}`}>
            {opportunity.match.label}
          </span>
        </header>

        <h2 className="modal-title">{opportunity.title}</h2>
        <p className="modal-provider">{opportunity.company || opportunity.companyName}</p>

        {/* Meta grid — use dl for key/value pairs */}
        <dl className="modal-meta-grid">
          {opportunity.location && (
            <span className="modal-meta-item">
              <span className="modal-meta-icon">📍</span>
              <span>{opportunity.location}</span>
            </span>
          )}
          {opportunity.stipend && (
            <span className="modal-meta-item">
              <span className="modal-meta-icon">💰</span>
              <span>{opportunity.stipend}</span>
            </span>
          )}
          {opportunity.sector && (
            <span className="modal-meta-item">
              <span className="modal-meta-icon">🧭</span>
              <span>Sector: {opportunity.sector}</span>
            </span>
          )}
          {opportunity.minimumNqfLevel && (
            <span className="modal-meta-item">
              <span className="modal-meta-icon">🎓</span>
              <span>Minimum NQF: {opportunity.minimumNqfLevel}</span>
            </span>
          )}
          {opportunity.requiredQualificationTitle && (
            <span className="modal-meta-item">
              <span className="modal-meta-icon">📘</span>
              <span>Qualification: {opportunity.requiredQualificationTitle}</span>
            </span>
          )}
          {opportunity.preferredLearningArea && (
            <span className="modal-meta-item">
              <span className="modal-meta-icon">🧩</span>
              <span>Learning area: {opportunity.preferredLearningArea}</span>
            </span>
          )}
          {opportunity.closingDate && (
            <span className="modal-meta-item">
              <span className="modal-meta-icon">📅</span>
              <span>Closes: {opportunity.closingDate}</span>
            </span>
          )}
        </dl>

        {opportunity.description && (
          <section className="modal-section">
            <h3 className="modal-section-title">About this opportunity</h3>
            <p className="modal-description">{opportunity.description}</p>
          </section>
        )}

        {opportunity.requiredSkills?.length > 0 && (
          <section className="modal-section">
            <h3 className="modal-section-title">Required Skills</h3>
            <ul className="modal-chip-list">
              {opportunity.requiredSkills.map((skill) => (
                <li
                  key={normalizeText(skill)}
                  className={`modal-chip ${
                    opportunity.match.matchedRequiredSkills.includes(normalizeText(skill))
                      ? "modal-chip--matched"
                      : "modal-chip--missing"
                  }`}
                >
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        )}

        {opportunity.preferredSkills?.length > 0 && (
          <section className="modal-section">
            <h3 className="modal-section-title">Preferred Skills</h3>
            <ul className="modal-chip-list">
              {opportunity.preferredSkills.map((skill) => (
                <li
                  key={normalizeText(skill)}
                  className={`modal-chip ${
                    opportunity.match.matchedPreferredSkills.includes(normalizeText(skill))
                      ? "modal-chip--matched"
                      : ""
                  }`}
                >
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        )}

        {opportunity.match.reasons.length > 0 && (
          <section className="modal-section">
            <h3 className="modal-section-title">Your match factors</h3>
            <ul className="modal-reason-list">
              {opportunity.match.reasons.map((r, i) => (
                <li key={i} className="modal-reason-item">
                  <span className="modal-reason-dot" />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}

        {opportunity.companyUrl && (
          <a
            href={opportunity.companyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="modal-company-link"
          >
            More about {opportunity.company || "this provider"} ↗
          </a>
        )}

        <footer className="modal-footer">
          <button className="modal-btn modal-btn--secondary" onClick={onClose}>Close</button>
          <button
            className="modal-btn modal-btn--primary"
            onClick={() => onApply(opportunity)}
            disabled={alreadyApplied}
          >
            {alreadyApplied ? "Already Applied" : "Apply Now"}
          </button>
        </footer>
      </article>
    </aside>
  );
}

// ─── Apply Confirmation Modal ────────────────────────────────────────────────

function ApplyConfirmModal({ opportunity, onConfirm, onCancel, submitting }) {
  return (
    <aside className="modal-backdrop" onClick={onCancel} role="dialog" aria-modal="true" aria-label="Confirm application">
      <article className="modal-sheet modal-sheet--confirm" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-icon" aria-hidden="true">🚀</p>
        <h2 className="confirm-title">Confirm Application</h2>
        <p className="confirm-body">
          You're about to apply for <strong>{opportunity.title}</strong> at{" "}
          <strong>{opportunity.company || opportunity.companyName}</strong>.
        </p>
        <p className="confirm-note">
          Once submitted, your application cannot be edited. Make sure your profile is up to date before confirming.
        </p>
        <footer className="modal-footer">
          <button className="modal-btn modal-btn--secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
          <button className="modal-btn modal-btn--primary" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Submitting…" : "Confirm & Submit"}
          </button>
        </footer>
      </article>
    </aside>
  );
}

// ─── Success toast ───────────────────────────────────────────────────────────

function SuccessToast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return <output className="success-toast" role="status">{message}</output>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "match",      label: "Best Match"      },
  { value: "alpha_asc",  label: "A → Z"           },
  { value: "alpha_desc", label: "Z → A"           },
  { value: "date_asc",   label: "Closing: Soonest"},
  { value: "date_desc",  label: "Closing: Latest" },
];

const TYPE_FILTERS = ["All", "Learnership", "Internship", "Apprenticeship", "Graduate"];

// ─── Main component ──────────────────────────────────────────────────────────

function OpportunityList(props) {
  const [opportunities, setOpportunities]         = useState([]);
  const [user, setUser]                           = useState(null);
  const [applicantProfile, setApplicantProfile]   = useState(null);
  const [fetchedAppliedIds, setFetchedAppliedIds] = useState(new Set());
  const [sessionApplied, setSessionApplied]       = useState(new Set());

  const [searchQuery, setSearchQuery]   = useState("");
  const [sortBy, setSortBy]             = useState("match");
  const [typeFilter, setTypeFilter]     = useState("All");
  const [sectorFilter, setSectorFilter] = useState("All");

  const [detailOpp, setDetailOpp]   = useState(null);
  const [confirmOpp, setConfirmOpp] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Auto-open detail modal when arriving from a notification link
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlightId = params.get("opportunityId");
    if (!highlightId || opportunities.length === 0) return;
    const found = opportunities.find((o) => o.id === highlightId);
    if (found) {
      setDetailOpp({ ...found, match: getMatchDetails(applicantProfile, found) });
    }
    // Clear the query param so navigating back doesn't re-open the modal
    navigate(location.pathname, { replace: true });
  }, [location.search, opportunities, applicantProfile]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    setFetchedAppliedIds(new Set());
    setSessionApplied(new Set());
    setApplicantProfile(null);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "applicants", user.uid));
        if (snap.exists()) setApplicantProfile(snap.data());
      } catch (e) { console.error(e); }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchOpps = async () => {
      try {
        const q = query(collection(db, "opportunities"), where("status", "==", "approved"));
        const snap = await getDocs(q);
        setOpportunities(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
    };
    fetchOpps();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchApps = async () => {
      const q = query(collection(db, "applications"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      setFetchedAppliedIds(new Set(snap.docs.map((d) => d.data().opportunityId)));
    };
    fetchApps();
  }, [user]);

  const availableSectors = useMemo(() => {
    const sectors = [...new Set(opportunities.map((o) => o.sector).filter(Boolean))].sort();
    return ["All", ...sectors];
  }, [opportunities]);

  const visibleOpportunities = useMemo(() => {
    let list = opportunities
      .filter((opp) => !fetchedAppliedIds.has(opp.id) && !sessionApplied.has(opp.id))
      .map((opp) => ({ ...opp, match: getMatchDetails(applicantProfile, opp) }));

    if (typeFilter !== "All")
      list = list.filter((o) => normalizeText(o.type) === normalizeText(typeFilter));

    if (sectorFilter !== "All")
      list = list.filter((o) => o.sector === sectorFilter);

    if (searchQuery.trim()) {
      const q = normalizeText(searchQuery);
      list = list.filter(
        (o) =>
          normalizeText(o.title).includes(q) ||
          normalizeText(o.company || o.companyName || "").includes(q) ||
          normalizeText(o.sector || "").includes(q) ||
          normalizeText(o.location || "").includes(q)
      );
    }

    switch (sortBy) {
      case "alpha_asc":  list.sort((a, b) => (a.title || "").localeCompare(b.title || "")); break;
      case "alpha_desc": list.sort((a, b) => (b.title || "").localeCompare(a.title || "")); break;
      case "date_asc":
        list.sort((a, b) => !a.closingDate ? 1 : !b.closingDate ? -1 : new Date(a.closingDate) - new Date(b.closingDate));
        break;
      case "date_desc":
        list.sort((a, b) => !a.closingDate ? 1 : !b.closingDate ? -1 : new Date(b.closingDate) - new Date(a.closingDate));
        break;
      default: list.sort((a, b) => b.match.score - a.match.score);
    }

    return list;
  }, [opportunities, fetchedAppliedIds, sessionApplied, applicantProfile, searchQuery, sortBy, typeFilter, sectorFilter]);

  const openConfirm = (opportunity) => {
    if (!user) { alert("Please log in first"); return; }
    if (fetchedAppliedIds.has(opportunity.id) || sessionApplied.has(opportunity.id)) {
      alert("You already applied for this opportunity"); return;
    }
    setDetailOpp(null);
    setConfirmOpp(opportunity);
  };

  const handleConfirmApply = async () => {
    if (!confirmOpp || submitting) return;
    setSubmitting(true);
    try {
      const applicationData = {
        userId:        user.uid,
        opportunityId: confirmOpp.id,
        title:         confirmOpp.title || "",
        company:       confirmOpp.company || confirmOpp.companyName || "",
        status:        "Submitted",
        stageIndex:    0,
        appliedAt:     Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, "applications"), applicationData);
      await addDoc(collection(db, "notifications"), {
        userId:        user.uid,
        title:         "Application submitted",
        body:          `Your application for ${confirmOpp.title} has been submitted.`,
        read:          false,
        type:          "status_update",
        applicationId: docRef.id,
        createdAt:     Timestamp.now(),
      });
      setSessionApplied((prev) => new Set([...prev, confirmOpp.id]));
      if (props.onApplicationAdded) props.onApplicationAdded({ id: docRef.id, ...applicationData });
      setConfirmOpp(null);
      setToast(`Application for "${confirmOpp.title}" submitted!`);
    } catch (err) {
      console.error("Error applying:", err);
      alert("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="opportunities-page">
      <header className="opportunities-header">
        <p className="eyebrow">Opportunities</p>
        <h1 className="opportunities-title">Available Opportunities</h1>
        <p className="opportunities-subtitle">
          Find and apply for learnerships, internships and apprenticeships
        </p>
      </header>

      {/* ── Filter / Sort bar ── */}
      <search className="filter-bar">
        <label className="filter-bar__search-wrap">
          <span className="filter-bar__search-icon" aria-hidden="true">🔍</span>
          <input
            className="filter-bar__search"
            type="search"
            placeholder="Search by title, company, sector…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search opportunities"
          />
          {searchQuery && (
            <button className="filter-bar__clear" onClick={() => setSearchQuery("")} aria-label="Clear search">✕</button>
          )}
        </label>

        <nav className="filter-bar__pills" aria-label="Filter by type">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              className={`filter-pill ${typeFilter === t ? "filter-pill--active" : ""}`}
              onClick={() => setTypeFilter(t)}
              aria-pressed={typeFilter === t}
            >
              {t}
            </button>
          ))}
        </nav>

        {availableSectors.length > 2 && (
          <select
            className="filter-bar__select"
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            aria-label="Filter by sector"
          >
            {availableSectors.map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Sectors" : s}</option>
            ))}
          </select>
        )}

        <select
          className="filter-bar__select filter-bar__select--sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort opportunities"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <span className="filter-bar__count" aria-live="polite">
          {visibleOpportunities.length}{" "}
          {visibleOpportunities.length === 1 ? "result" : "results"}
        </span>
      </search>

      {/* ── Grid ── */}
      <section className="opportunities-grid">
        {opportunities.length === 0 && (
          <p className="opportunities-empty">No opportunities available at the moment.</p>
        )}
        {visibleOpportunities.length === 0 && opportunities.length > 0 && (
          <p className="opportunities-empty">No opportunities match your filters.</p>
        )}

        {visibleOpportunities.map((opportunity) => {
          const isApplied = sessionApplied.has(opportunity.id);
          return (
            <article key={opportunity.id} className="opportunity-card">
              <header className="opportunity-card__header">
                <h3 className="opportunity-card__title">{opportunity.title}</h3>
                <p className="opportunity-card__badges">
                  {opportunity.type && (
                    <span className="opportunity-card__type">{opportunity.type}</span>
                  )}
                  <span className={`opportunity-card__match opportunity-card__match--${opportunity.match.className}`}>
                    {opportunity.match.label}
                  </span>
                </p>
              </header>

              <section className="opportunity-card__meta">
                <p className="opportunity-card__provider">
                  {opportunity.company || opportunity.companyName}
                </p>
                {opportunity.location  && <p className="opportunity-card__location">📍 {opportunity.location}</p>}
                {opportunity.stipend   && <p className="opportunity-card__stipend">💰 {opportunity.stipend}</p>}
                {opportunity.sector    && <p className="opportunity-card__location">🧭 {opportunity.sector}</p>}
                {opportunity.minimumNqfLevel && <p className="opportunity-card__location">🎓 NQF {opportunity.minimumNqfLevel}+</p>}
              </section>

              {opportunity.description && (
                <p className="opportunity-card__description">
                  {opportunity.description.length > 140
                    ? opportunity.description.slice(0, 140) + "…"
                    : opportunity.description}
                </p>
              )}

              {opportunity.match.reasons.length > 0 && (
                <p className="opportunity-card__match-reasons">
                  {opportunity.match.reasons.slice(0, 2).join(" • ")}
                </p>
              )}

              <footer className="opportunity-card__footer">
                {opportunity.closingDate && (
                  <p className="opportunity-card__location" style={{ marginBottom: "0.5rem" }}>
                    📅 Closes: {opportunity.closingDate}
                  </p>
                )}
                <nav className="opportunity-card__actions">
                  <button className="opportunity-card__view-btn" onClick={() => setDetailOpp(opportunity)}>
                    View Details
                  </button>
                  <button
                    className="opportunity-card__apply-btn"
                    onClick={() => openConfirm(opportunity)}
                    disabled={isApplied}
                  >
                    {isApplied ? "Applied ✓" : "Apply Now"}
                  </button>
                </nav>
              </footer>
            </article>
          );
        })}
      </section>

      {detailOpp && (
        <OpportunityDetailModal
          opportunity={detailOpp}
          onClose={() => setDetailOpp(null)}
          onApply={openConfirm}
          alreadyApplied={fetchedAppliedIds.has(detailOpp.id) || sessionApplied.has(detailOpp.id)}
        />
      )}

      {confirmOpp && (
        <ApplyConfirmModal
          opportunity={confirmOpp}
          onConfirm={handleConfirmApply}
          onCancel={() => setConfirmOpp(null)}
          submitting={submitting}
        />
      )}

      {toast && <SuccessToast message={toast} onDone={() => setToast(null)} />}
    </section>
  );
}

export default OpportunityList;