import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <aside style={styles.sidebar}>
      <h2 style={styles.title}>Admin</h2>

      <nav style={styles.nav} aria-label="Admin navigation">
        <ul style={styles.navList}>
          <li>
            <Link
              to="/dashboard/admin"
              style={{
                ...styles.link,
                ...(isActive("/dashboard/admin") && styles.active),
              }}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard/admin/opportunities"
              style={{
                ...styles.link,
                ...(isActive("/dashboard/admin/opportunities") && styles.active),
              }}
            >
              Opportunities
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard/admin/users"
              style={{
                ...styles.link,
                ...(isActive("/dashboard/admin/users") && styles.active),
              }}
            >
              Users
            </Link>
          </li>
        </ul>
      </nav>

      <footer style={styles.footer}>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </footer>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "220px",
    height: "100vh",
    background: "#111",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
  },
  title: {
    color: "#fff",
    marginBottom: "15px",
  },
  nav: {
    flex: 1,
  },
  navList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  link: {
    display: "block",
    color: "#fff",
    textDecoration: "none",
    padding: "10px",
    marginBottom: "8px",
  },
  active: {
    background: "#ff7b00",
  },
  footer: {
    paddingTop: "1rem",
    borderTop: "1px solid #333",
  },
  logoutBtn: {
    width: "100%",
    padding: "10px",
    background: "transparent",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left",
  },
};