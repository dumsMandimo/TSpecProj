import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./adminStyle.css";
import { getAdminDashboard } from "../../services/api";
import { auth, db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      // 1. Check if logged in
      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      // 2. Check if admin
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() || userSnap.data().role !== "admin") {
        navigate("/login");
        return;
      }

      // 3. Only fetch stats if admin check passed
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

    init();
  }, [navigate]);

  if (loading) return <main className="container"><p>Loading dashboard...</p></main>;
  if (error) return <main className="container"><p className="error">{error}</p></main>;

  return (
    <main className="container">
      <h1 className="heading">Admin Dashboard</h1>

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