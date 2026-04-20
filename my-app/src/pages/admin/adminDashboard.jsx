import { useEffect, useState } from "react";
import "./adminStyle.css";
import { getAdminDashboard } from "../../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getAdminDashboard();
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) return <main className="container"><p>Loading dashboard...</p></main>;
  if (error) return <main className="container"><p className="error">{error}</p></main>;

  return (
    <main className="container">
      <h1 className="heading">Dashboard</h1>

      <section className="cardContainer">
        <article className="card">
          <h2>Opportunities</h2>
          <p className="number">{stats.total}</p>
        </article>

        <article className="card">
          <h2>Approved</h2>
          <p className="number">{stats.approved}</p>
        </article>

        <article className="card">
          <h2>Pending</h2>
          <p className="number">{stats.pending}</p>
        </article>
      </section>
    </main>
  );
}