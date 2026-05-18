import "./Navbar.css";

export default function Navbar({ providerName, onLogout }) {
  const initials = providerName
    ? providerName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "P";

  return (
    <header className="navbar">
      <section className="navbar__left">
        <p className="navbar__greeting">
          Welcome back,{" "}
          <strong>{providerName || "Provider"}</strong>
        </p>
      </section>

      <nav
        className="navbar__actions"
        aria-label="User actions"
      >
        <section
          className="navbar__user-chip"
          aria-label={`Logged in as ${providerName}`}
        >
          <span
            className="navbar__avatar"
            aria-hidden="true"
          >
            {initials}
          </span>

          <span className="navbar__user-name">
            {providerName}
          </span>
        </section>

        <button
          className="navbar__logout-btn"
          onClick={onLogout}
          type="button"
        >
          Sign out
        </button>
      </nav>
    </header>
  );
}