import { useState, useEffect } from "react";
import { subscribeToProviderApplications, updateApplicationStatus } from "../../../services/providerService";
import { auth } from "../../../services/firebase";
import "./ApplicationsPanel.css";

const STATUS_LABELS = {
  received:    "Received",
  shortlisted: "Shortlisted",
  accepted:    "Accepted",
  rejected:    "Rejected",
};

export default function ApplicationsPanel() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [updating, setUpdating]         = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribe = subscribeToProviderApplications(uid, (data) => {
      setApplications(data);
      setLoading(false);
    }, (err) => {
      setError("Failed to load applications.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdating(applicationId);
    try {
      await updateApplicationStatus(applicationId, newStatus);
    } catch {
      setError("Failed to update status. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <p className="applications-panel__loading">Loading applications...</p>;
  if (error)   return <p className="applications-panel__error" role="alert">{error}</p>;

  return (
    <section aria-label="Applications">
      <header className="applications-panel__header">
        <h2 className="applications-panel__title">Applications</h2>
        <p className="applications-panel__subtitle">Review and manage applicant submissions</p>
      </header>

      {applications.length === 0 ? (
        <p className="applications-panel__empty">No applications received yet.</p>
      ) : (
        <ul className="applications-panel__list">
          {applications.map((app) => (
            <li key={app.id} className="applications-panel__item">
              <article className="application-card">
                <header className="application-card__info">
                  <h3 className="application-card__name">{app.applicantName}</h3>
                  <p className="application-card__meta">
                    {app.opportunityTitle} &middot;{" "}
                    <span
                      className={`application-card__status application-card__status--${app.status}`}
                    >
                      {STATUS_LABELS[app.status] ?? app.status}
                    </span>
                  </p>
                </header>

                <nav
                  className="application-card__actions"
                  aria-label={`Actions for ${app.applicantName}`}
                >
                  <button
                    className="application-card__btn application-card__btn--accept"
                    onClick={() => handleStatusChange(app.id, "accepted")}
                    disabled={updating === app.id || app.status === "accepted"}
                    type="button"
                    aria-label={`Accept ${app.applicantName}`}
                  >
                    Accept
                  </button>
                  <button
                    className="application-card__btn application-card__btn--shortlist"
                    onClick={() => handleStatusChange(app.id, "shortlisted")}
                    disabled={updating === app.id || app.status === "shortlisted"}
                    type="button"
                    aria-label={`Shortlist ${app.applicantName}`}
                  >
                    Shortlist
                  </button>
                  <button
                    className="application-card__btn application-card__btn--reject"
                    onClick={() => handleStatusChange(app.id, "rejected")}
                    disabled={updating === app.id || app.status === "rejected"}
                    type="button"
                    aria-label={`Reject ${app.applicantName}`}
                  >
                    Reject
                  </button>
                </nav>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
