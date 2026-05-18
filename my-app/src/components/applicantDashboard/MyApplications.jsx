import "./MyApplications.css";
import { TYPE_LABELS } from "./opportunityConstants";

const stages = ["Submitted", "Received", "Under Evaluation", "Final Decision"];

function ProgressTracker({ stageIndex = 0, status = "" }) {
  const isAccepted = status === "accepted" || status === "Accepted";
  const isRejected = status === "rejected" || status === "Rejected";
  const isShortlisted = status === "shortlisted" || status === "Shortlisted";

  return (
    <div className="progress-tracker" role="list" aria-label="Application progress">
      {stages.map((stage, index) => {
        const isFinal = stage === "Final Decision";
        const circleClass = [
          "progress-tracker__dot",
          index <= stageIndex ? "progress-tracker__dot--active" : "",
          isFinal && isAccepted ? "progress-tracker__dot--accepted" : "",
          isFinal && isRejected ? "progress-tracker__dot--rejected" : "",
          isFinal && isShortlisted ? "progress-tracker__dot--shortlisted" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const label =
          isFinal && isAccepted
            ? "Accepted"
            : isFinal && isRejected
            ? "Rejected"
            : isFinal && isShortlisted
            ? "Shortlisted"
            : stage;

        return (
          <div key={stage} className="progress-tracker__step" role="listitem">
            <span className={circleClass} aria-hidden="true" />
            <span
              className={`progress-tracker__label ${
                index <= stageIndex ? "progress-tracker__label--active" : ""
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MyApplications({ applications = [] }) {
  return (
    <section className="applicant-panel" aria-label="My applications">
      <header className="applicant-panel__header">
        <h2 className="applicant-panel__title">My Applications</h2>
        <p className="applicant-panel__subtitle">
          Track the status of your submissions
        </p>
      </header>

      {applications.length === 0 ? (
        <p className="applicant-panel__empty">
          No applications yet. Browse opportunities below to get started.
        </p>
      ) : (
        <ul className="applicant-panel__grid">
          {applications.map((application) => (
            <li key={application.id}>
              <article className="application-card">
                <header className="application-card__header">
                  <h3 className="application-card__title">{application.title}</h3>
                  {application.type && (
                    <span className="application-card__type">
                      {TYPE_LABELS[application.type] ?? application.type}
                    </span>
                  )}
                </header>
                <div className="application-card__meta">
                  <p className="application-card__company">{application.company}</p>
                  {application.location && (
                    <p className="application-card__location">{application.location}</p>
                  )}
                </div>
                <ProgressTracker
                  stageIndex={application.stageIndex ?? 0}
                  status={application.status}
                />
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default MyApplications;
