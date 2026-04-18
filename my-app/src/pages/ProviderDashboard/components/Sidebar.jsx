import "./Sidebar.css";

const NAV_ITEMS = [
  { key: "overview",      label: "Overview" },
  { key: "listings",      label: "My Listings" },
  { key: "applications",  label: "Applications" },
  { key: "create",        label: "Post Opportunity" },
];

export default function Sidebar({ setTab, activeTab }) {
  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <span className="sidebar__logo">UbuntuCareers</span>
        <span className="sidebar__role">Provider Portal</span>
      </header>

      <nav className="sidebar__nav" aria-label="Provider navigation">
        <ul className="sidebar__nav-list">
          {NAV_ITEMS.map(({ key, label }) => (
            <li key={key} className="sidebar__nav-item">
              <button
                className={`sidebar__nav-btn${activeTab === key ? " sidebar__nav-btn--active" : ""}`}
                onClick={() => setTab(key)}
                aria-current={activeTab === key ? "page" : undefined}
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
