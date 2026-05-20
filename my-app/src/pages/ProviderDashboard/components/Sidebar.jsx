import "./Sidebar.css";

const NAV_ITEMS = [
  { key: "overview",      label: "Overview",          icon: "⬡" },
  { key: "listings",      label: "My Listings",       icon: "◈" },
  { key: "analytics",     label: "Analytics",         icon: "📊" },
  { key: "applications",  label: "Applications",      icon: "◎" },
  { key: "notifications", label: "Notifications",     icon: "◇" },
  { key: "create",        label: "Post Opportunity",  icon: "+" },
];

export default function Sidebar({ setTab, activeTab, unreadCount = 0 }) {
  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <section className="sidebar__brand" aria-label="UbuntuCareers branding">
          <span className="sidebar__logo-mark">UC</span>

          <section className="sidebar__brand-text">
            <h1 className="sidebar__logo">UbuntuCareers</h1>
            <p className="sidebar__role">Provider Portal</p>
          </section>
        </section>
      </header>

      <nav className="sidebar__nav" aria-label="Provider navigation">
        <ul className="sidebar__nav-list">
          {NAV_ITEMS.map(({ key, label, icon }) => (
            <li key={key} className="sidebar__nav-item">
              <button
                className={`sidebar__nav-btn${
                  activeTab === key ? " sidebar__nav-btn--active" : ""
                }${key === "create" ? " sidebar__nav-btn--cta" : ""}`}
                onClick={() => setTab(key)}
                aria-current={activeTab === key ? "page" : undefined}
              >
                <span
                  className="sidebar__nav-icon"
                  aria-hidden="true"
                >
                  {icon}
                </span>

                <span className="sidebar__nav-label">
                  {label}
                </span>

                {key === "notifications" && unreadCount > 0 && (
                  <output
                    className="sidebar__badge"
                    aria-label={`${unreadCount} unread notifications`}
                  >
                    {unreadCount}
                  </output>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <footer className="sidebar__footer">
        <small className="sidebar__footer-text">
          Ubuntu · Community · Growth
        </small>
      </footer>
    </aside>
  );
}