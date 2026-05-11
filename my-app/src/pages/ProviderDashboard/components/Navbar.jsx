import "./Navbar.css";

export default function Navbar({ providerName, onLogout }) {
  return (
    <header className="navbar">
      <h1 className="navbar__title">Provider Dashboard</h1>

      <nav className="navbar__actions" aria-label="User actions">
        {providerName && (
          <span className="navbar__user" aria-label="Logged in as">
            {providerName}
          </span>
        )}
        <button
          className="navbar__logout-btn"
          onClick={onLogout}
          type="button"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
