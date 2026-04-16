export default function AdminDashboard() {
  console.log("ADMIN DASHBOARD RENDERED");

  return (
    <main style={styles.container}>
      <header>
        <h1 style={styles.heading}>Dashboard</h1>
      </header>

      <section style={styles.cardContainer}>
        
        <article style={styles.card}>
          <h2>Users</h2>
          <p style={styles.number}>1200</p>
        </article>

        <article style={styles.card}>
          <h2>Opportunities</h2>
          <p style={styles.number}>85</p>
        </article>

        <article style={styles.card}>
          <h2>Applications</h2>
          <p style={styles.number}>5400</p>
        </article>

        <article style={styles.card}>
          <h2>Pending</h2>
          <p style={styles.number}>12</p>
        </article>

      </section>
    </main>
  );
}