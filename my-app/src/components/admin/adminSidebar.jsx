import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.title}>Admin</h2>

      <Link
        to="/dashboard/admin"
        style={{
          ...styles.link,
          ...(isActive("/dashboard/admin") && styles.active),
        }}
      >
        Dashboard
      </Link>

      <Link
        to="/dashboard/admin/opportunities"
        style={{
          ...styles.link,
          ...(isActive("/dashboard/admin/opportunities") && styles.active),
        }}
      >
        Opportunities
      </Link>

      <Link
        to="/dashboard/admin/users"
        style={{
          ...styles.link,
          ...(isActive("/dashboard/admin/users") && styles.active),
        }}
      >
        Users
      </Link>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "220px",
    height: "100vh",
    background: "#111",
    padding: "15px",
  },
  title: {
    color: "#fff",
    marginBottom: "15px",
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
};