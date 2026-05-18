import { useState, useEffect, useMemo } from "react";
import {
  subscribeToProviderApplications,
  updateApplicationStatus,
} from "../../../services/providerService";
import { auth } from "../../../services/firebase";
import "./ApplicationsPanel.css";

const STATUS_LABELS = {
  submitted:   "Pending Review",
  shortlisted: "Shortlisted",
  accepted:    "Accepted",
  rejected:    "Rejected",
};

const STATUS_COLORS = {
  submitted:   "amber",
  shortlisted: "blue",
  accepted:    "green",
  rejected:    "red",
};

const FILTERS = ["all", "submitted", "shortlisted", "accepted", "rejected"];

export default function ApplicationsPanel({ initialFilter = "all" }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [updating, setUpdating]         = useState(null);
  const [filter, setFilter]             = useState(initialFilter);
  const [expanded, setExpanded]         = useState(null);
  const [search, setSearch]             = useState("");

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribe = subscribeToProviderApplications(
      uid,
      (data) => {
        setApplications(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to load applications.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdating(applicationId);

    try {
      await updateApplicationStatus(applicationId, newStatus);
    } catch (err) {
      console.error(err);
      setError("Failed to update status. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  const visible = useMemo(() => {
    let result =
      filter === "all"
        ? applications
        : applications.filter((a) => a.status === filter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();

      result = result.filter(
        (a) =>
          a.applicantName?.toLowerCase().includes(q) ||
          a.applicantEmail?.toLowerCase().includes(q) ||
          a.opportunityTitle?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [applications, filter, search]);

  if (loading) {
    return (
      <section className="ap-loading" aria-label="Loading applications">
        <span className="ap-spinner" />
        <p>Loading applications…</p>
      </section>
    );
  }

  if (error) {
    return (
      <p className="ap-error" role="alert">
        {error}
      </p>
    );
  }

  return (
    <section className="ap" aria-label="Applications">
      <header className="ap__header">
        <section>
          <h2 className="ap__title">Applications</h2>
          <p className="ap__subtitle">
            Review and manage applicant submissions
          </p>
        </section>

        <output className="ap__total-chip">
          {applications.length} total
        </output>
      </header>

      {/* Search */}
      <section
        className="ap__search-wrap"
        aria-label="Search applications"
      >
        <span className="ap__search-icon" aria-hidden="true">
          🔍
        </span>

        <input
          className="ap__search"
          type="search"
          placeholder="Search by name, email or opportunity…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search applications"
        />

        {search && (
          <button
            className="ap__search-clear"
            onClick={() => setSearch("")}
            type="button"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </section>

      {/* Filters */}
      <nav
        className="ap__filters"
        aria-label="Filter applications"
      >
        {FILTERS.map((f) => {
          const count =
            f === "all"
              ? applications.length
              : applications.filter((a) => a.status === f).length;

          return (
            <button
              key={f}
              className={`ap__filter-btn${
                filter === f ? " ap__filter-btn--active" : ""
              }`}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              type="button"
            >
              <span>
                {f === "all" ? "All" : STATUS_LABELS[f]}
              </span>

              <output className="ap__filter-count">
                {count}
              </output>
            </button>
          );
        })}
      </nav>

      {visible.length === 0 ? (
        <section className="ap__empty">
          <p>
            {search
              ? `No results for "${search}"`
              : `No ${
                  filter !== "all"
                    ? (STATUS_LABELS[filter] ?? filter).toLowerCase()
                    : ""
                } applications yet.`}
          </p>
        </section>
      ) : (
        <ul className="ap__list">
          {visible.map((app) => (
            <li key={app.id} className="ap__item">
              <article
                className={`ac${
                  expanded === app.id ? " ac--expanded" : ""
                }`}
              >
                <header>
                  <button
                    className="ac__summary"
                    onClick={() =>
                      setExpanded(
                        expanded === app.id ? null : app.id
                      )
                    }
                    aria-expanded={expanded === app.id}
                    type="button"
                  >
                    <section className="ac__left">
                      <span
                        className={`ac__status-dot ac__status-dot--${
                          STATUS_COLORS[app.status] ?? "grey"
                        }`}
                        aria-hidden="true"
                      />

                      <section>
                        <h3 className="ac__name">
                          {app.applicantName}
                        </h3>
                        <p className="ac__meta">
                          {app.opportunityTitle}
                        </p>
                      </section>
                    </section>

                    <section className="ac__right">
                      <span
                        className={`ac__badge ac__badge--${
                          STATUS_COLORS[app.status] ?? "grey"
                        }`}
                      >
                        {STATUS_LABELS[app.status] ?? app.status}
                      </span>

                      <span className="ac__chevron" aria-hidden="true">
                        {expanded === app.id ? "▲" : "▼"}
                      </span>
                    </section>
                  </button>
                </header>

                {expanded === app.id && (
                  <main className="ac__body">
                    {/* Contact */}
                    <section className="ac__section">
                      <h4 className="ac__section-title">Contact</h4>

                      {app.applicantEmail && (
                        <p className="ac__detail-row">
                          <span className="ac__detail-label">Email</span>
                          <a
                            href={`mailto:${app.applicantEmail}`}
                            className="ac__link"
                          >
                            {app.applicantEmail}
                          </a>
                        </p>
                      )}

                      {app.applicantPhone && (
                        <p className="ac__detail-row">
                          <span className="ac__detail-label">Phone</span>
                          <a
                            href={`tel:${app.applicantPhone}`}
                            className="ac__link"
                          >
                            {app.applicantPhone}
                          </a>
                        </p>
                      )}
                    </section>

                    {/* Profile */}
                    {(app.education || app.skills || app.interests) && (
                      <section className="ac__section">
                        <h4 className="ac__section-title">Profile</h4>

                        {app.education && (
                          <p className="ac__detail-row">
                            <span className="ac__detail-label">Education</span>
                            <span>{app.education}</span>
                          </p>
                        )}

                        {app.skills && (
                          <p className="ac__detail-row">
                            <span className="ac__detail-label">Skills</span>
                            <span>{app.skills}</span>
                          </p>
                        )}

                        {app.interests && (
                          <p className="ac__detail-row">
                            <span className="ac__detail-label">Interests</span>
                            <span>{app.interests}</span>
                          </p>
                        )}
                      </section>
                    )}

                    {/* CV */}
                    <section className="ac__section">
                      {app.cvUrl ? (
                        <a
                          className="ac__cv-btn"
                          href={app.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          ⬇ Download CV
                        </a>
                      ) : (
                        <p className="ac__no-cv">No CV uploaded.</p>
                      )}
                    </section>

                    {/* Actions */}
                    <section className="ac__section">
                      <h4 className="ac__section-title">Update Status</h4>

                      <nav
                        className="ac__actions"
                        aria-label={`Actions for ${app.applicantName}`}
                      >
                        {[
                          { status: "accepted",    label: "✓ Accept" },
                          { status: "shortlisted", label: "★ Shortlist" },
                          { status: "rejected",    label: "✕ Reject" },
                        ].map(({ status, label }) => (
                          <button
                            key={status}
                            className={`ac__action-btn ac__action-btn--${status}${
                              app.status === status
                                ? " ac__action-btn--current"
                                : ""
                            }`}
                            onClick={() =>
                              handleStatusChange(app.id, status)
                            }
                            disabled={
                              updating === app.id || app.status === status
                            }
                            type="button"
                          >
                            {updating === app.id ? "Updating…" : label}
                          </button>
                        ))}
                      </nav>

                      {app.status !== "submitted" && (
                        <p className="ac__current-status">
                          Current:{" "}
                          <strong>
                            {STATUS_LABELS[app.status] ?? app.status}
                          </strong>
                        </p>
                      )}
                    </section>
                  </main>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}