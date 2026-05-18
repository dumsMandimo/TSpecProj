import "./Sidebar.css";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "listings", label: "Listings" },
  { id: "applications", label: "Applications" },
  { id: "create", label: "Post Opportunity" },
];

export default function Sidebar({ activeTab, setTab }) {
  return (
    <aside className="provider-sidebar" aria-label="Provider navigation">
      <p className="provider-sidebar__brand">Provider</p>
      <nav>
        <ul className="provider-sidebar__nav">
          {NAV_ITEMS.map(({ id, label }) => (
            <li key={id}>
              <button
                type="button"
                className={`provider-sidebar__btn ${
                  activeTab === id ? "provider-sidebar__btn--active" : ""
                }`}
                onClick={() => setTab(id)}
                aria-current={activeTab === id ? "page" : undefined}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
