import { useState, useEffect, useMemo } from "react";
import {
  subscribeToProviderApplications,
  updateApplicationStatus,
} from "../../../services/providerService";
import { auth } from "../../../services/firebase";
import "./ApplicationsPanel.css";

const STATUS_LABELS = {
  submitted: "Pending Review",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  rejected: "Rejected",
};

const STATUS_COLORS = {
  submitted: "amber",
  shortlisted: "blue",
  accepted: "green",
  rejected: "red",
};

const FILTERS = ["all", "submitted", "shortlisted", "accepted", "rejected"];

export default function ApplicationsPanel({ initialFilter = "all" }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState(initialFilter);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");

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
      <section className="ap-loading">
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
    <section className="ap">
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

      {/* SEARCH */}
      <section className="ap__search-wrap">
        <input
          className="ap__search"
          type="search"
          placeholder="Search by name, email or opportunity…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {search && (
          <button
            className="ap__search-clear"
            onClick={() => setSearch("")}
            type="button"
          >
            ✕
          </button>
        )}
      </section>

      {/* FILTERS */}
      <nav className="ap__filters">
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
              type="button"
            >
              {f === "all" ? "All" : STATUS_LABELS[f]} ({count})
            </button>
          );
        })}
      </nav>

      {/* LIST */}
      {visible.length === 0 ? (
        <section className="ap__empty">
          No applications found.
        </section>
      ) : (
        <ul className="ap__list">
          {visible.map((app) => (
            <li key={app.id} className="ap__item">
              <article
                className={`ac ${
                  expanded === app.id ? " ac--expanded" : ""
                }`}
              >
                {/* HEADER */}
                <button
                  className="ac__summary"
                  onClick={() =>
                    setExpanded(expanded === app.id ? null : app.id)
                  }
                  type="button"
                >
                  <section className="ac__left">
                    <span
                      className={`ac__status-dot ac__status-dot--${
                        STATUS_COLORS[app.status] ?? "grey"
                      }`}
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

                    <span className="ac__chevron">
                      {expanded === app.id ? "▲" : "▼"}
                    </span>
                  </section>
                </button>

                {/* BODY */}
                {expanded === app.id && (
                  <main className="ac__body">
                    {/* CONTACT */}
                    <section className="ac__section">
                      <h4>Contact</h4>

                      {app.applicantEmail && (
                        <p>
                          <a href={`mailto:${app.applicantEmail}`}>
                            {app.applicantEmail}
                          </a>
                        </p>
                      )}

                      {app.applicantPhone && (
                        <p>
                          <a href={`tel:${app.applicantPhone}`}>
                            {app.applicantPhone}
                          </a>
                        </p>
                      )}
                    </section>

                    {/* PROFILE */}
                    <section className="ac__section">
                      <h4>Profile</h4>

                      {app.education && <p>{app.education}</p>}
                      {app.skills && <p>{app.skills}</p>}
                      {app.interests && <p>{app.interests}</p>}
                    </section>

                    {/* CV */}
                    <section className="ac__section">
                      {app.cvUrl ? (
                        <a
                          className="ac__cv-btn"
                          href={app.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download CV
                        </a>
                      ) : (
                        <p>No CV uploaded.</p>
                      )}
                    </section>

                    {/* ACTIONS */}
                    <section className="ac__section">
                      {["accepted", "shortlisted", "rejected"].map(
                        (status) => (
                          <button
                            key={status}
                            onClick={() =>
                              handleStatusChange(app.id, status)
                            }
                            disabled={
                              updating === app.id ||
                              app.status === status
                            }
                          >
                            {status}
                          </button>
                        )
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