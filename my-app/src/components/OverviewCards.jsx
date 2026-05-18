export default function OverviewCards({ setTab }) {
  const stats = [
    { id: "listings", label: "Listings", value: 3, hint: "Active opportunities" },
    { id: "applications", label: "Applications", value: 12, hint: "Total submissions" },
    { id: "applications", label: "Shortlisted", value: 4, hint: "Under review" },
    { id: "applications", label: "Accepted", value: 2, hint: "Successful placements" },
  ];

  return (
    <section aria-label="Dashboard overview">
      <header className="dash-panel__header">
        <h2 className="dash-panel__title">Overview</h2>
        <p className="dash-panel__subtitle">
          A quick snapshot of your listings and applicant activity
        </p>
      </header>

      <div className="dash-stat-grid">
        {stats.map((item) => (
          <article
            key={item.label}
            className="dash-stat-card"
            role="button"
            tabIndex={0}
            onClick={() => setTab?.(item.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setTab?.(item.id);
            }}
            style={{ cursor: setTab ? "pointer" : "default" }}
          >
            <p className="dash-stat-card__label">{item.label}</p>
            <p className="dash-stat-card__value">{item.value}</p>
            <span className="dash-stat-card__hint">{item.hint}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
