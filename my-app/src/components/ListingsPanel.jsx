export default function ListingsPanel() {
  const listings = [
    { title: "Software Internship", status: "Approved" },
    { title: "Business Learnership", status: "Pending" },
  ];

  const badgeClass = (status) =>
    status === "Approved" ? "dash-badge--approved" : "dash-badge--pending";

  return (
    <section aria-label="My listings">
      <header className="dash-panel__header">
        <h2 className="dash-panel__title">My Listings</h2>
        <p className="dash-panel__subtitle">
          Manage all your posted opportunities
        </p>
      </header>

      {listings.length === 0 ? (
        <p className="dash-panel__empty">
          No listings yet. Post your first opportunity to get started.
        </p>
      ) : (
        <ul className="dash-list">
          {listings.map((item) => (
            <li key={item.title}>
              <article className="dash-card dash-list-item">
                <header>
                  <h3 className="dash-card__title">{item.title}</h3>
                  <p className="dash-card__meta">Opportunity listing</p>
                </header>
                <span className={`dash-badge ${badgeClass(item.status)}`}>
                  {item.status}
                </span>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
