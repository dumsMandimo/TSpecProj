export default function AdminDashboard() {
  console.log("ADMIN DASHBOARD RENDERED");

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Dashboard</h1>

      <div style={styles.cardContainer}>
        <div style={styles.card}>
          <h3>Users</h3>
          <p style={styles.number}>1200</p>
        </div>

        <div style={styles.card}>
          <h3>Opportunities</h3>
          <p style={styles.number}>85</p>
        </div>

        <div style={styles.card}>
          <h3>Applications</h3>
          <p style={styles.number}>5400</p>
        </div>

        <div style={styles.card}>
          <h3>Pending</h3>
          <p style={styles.number}>12</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    background: "#fff", // white
    minHeight: "100vh",
  },
  heading: {
    marginBottom: "20px",
    color: "#111", // black
  },
  cardContainer: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
  },
  card: {
    flex: "1",
    minWidth: "200px",
    padding: "15px",
    background: "#fff",
    border: "1px solid #ddd",
    borderLeft: "5px solid #ff7b00", // orange
  },
  number: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#111", // black
  },
};