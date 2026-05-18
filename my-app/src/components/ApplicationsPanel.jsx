export default function ApplicationsPanel() {
  const applications = [
    { name: "John Doe", role: "Software Internship", status: "Received" },
    { name: "Sarah Kim", role: "Business Learnership", status: "Shortlisted" },
  ];

  const badgeClass = (status) => {
    if (status === "Shortlisted") return "dash-badge--shortlisted";
    if (status === "Accepted") return "dash-badge--approved";
    return "dash-badge--received";
  };

  return (
    <section aria-label="Applications">
      <header className="dash-panel__header">
        <h2 className="dash-panel__title">Applications</h2>
        <p className="dash-panel__subtitle">
          Review and manage applicant submissions
        </p>
      </header>

      {applications.length === 0 ? (
        <p className="dash-panel__empty">
          No applications received yet. They will appear here when applicants apply.
        </p>
      ) : (
        <ul className="dash-list">
          {applications.map((app) => (
            <li key={app.name}>
              <article className="dash-card dash-list-item">
                <header>
                  <h3 className="dash-card__title">{app.name}</h3>
                  <p className="dash-card__meta">{app.role}</p>
                </header>

                <div className="dash-actions">
                  <span className={`dash-badge ${badgeClass(app.status)}`}>
                    {app.status}
                  </span>
                  <button type="button" className="dash-btn dash-btn--primary">
                    Accept
                  </button>
                  <button type="button" className="dash-btn dash-btn--ghost">
                    Shortlist
                  </button>
                  <button type="button" className="dash-btn dash-btn--danger">
                    Reject
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
