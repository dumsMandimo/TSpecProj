// adminDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./adminStyle.css";
import { getAdminDashboard, getPendingProviders, approveProvider, rejectProvider } from "../../services/api";
import { auth, db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      try {
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

        // 3. Fetch dashboard stats and pending providers
        const [dashboardData, pendingProviders] = await Promise.all([
          getAdminDashboard(),
          getPendingProviders(),
        ]);
        setStats(dashboardData);
        setProviders(pendingProviders);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [navigate]);

  const handleApprove = async (uid) => {
    setActionLoading(uid);
    try {
      await approveProvider(uid);
      setProviders((prev) => prev.filter((p) => p.id !== uid));
    } catch (err) {
      console.error("Approve failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (uid) => {
    setActionLoading(uid);
    try {
      await rejectProvider(uid);
      setProviders((prev) => prev.filter((p) => p.id !== uid));
    } catch (err) {
      console.error("Reject failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

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

      {/* Pending providers section */}
      <section className="providers-section">
        <h2 className="providers-heading">
          Pending Providers
          {providers.length > 0 && (
            <span className="providers-badge">{providers.length}</span>
          )}
        </h2>

        {providers.length === 0 ? (
          <p className="providers-empty">No providers pending approval.</p>
        ) : (
          <div className="providers-list">
            {providers.map((provider) => (
              <article key={provider.id} className="provider-card">
                <div className="provider-info">
                  <h3 className="provider-name">{provider.organisationName}</h3>
                  <div className="provider-meta">
                    <span>{provider.contactName}</span>
                    <span className="meta-dot">·</span>
                    <span>{provider.sector}</span>
                    <span className="meta-dot">·</span>
                    <span>{provider.province}</span>
                  </div>
                  <p className="provider-description">{provider.description}</p>
                  <p className="provider-email">{provider.email}</p>
                </div>
                <div className="provider-actions">
                  <button
                    className="btn-approve"
                    onClick={() => handleApprove(provider.id)}
                    disabled={actionLoading === provider.id}
                  >
                    {actionLoading === provider.id ? "..." : "Approve"}
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleReject(provider.id)}
                    disabled={actionLoading === provider.id}
                  >
                    {actionLoading === provider.id ? "..." : "Reject"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}