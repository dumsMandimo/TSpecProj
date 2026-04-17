import { useEffect, useState } from "react";
import "./adminStyle.css";  // ← Import the CSS file
import { getAdminDashboard } from "../../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getAdminDashboard();
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      }
    }

    fetchStats();
  }, []);

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