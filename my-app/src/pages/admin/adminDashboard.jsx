// adminDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./adminStyle.css";
import { getAdminDashboard, getPendingProviders, approveProvider, rejectProvider } from "../../services/api";
import { auth, db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalOpportunities: 0, pendingApprovals: 0, totalProviders: 0 });
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      try {
        if (!auth.currentUser) {
          navigate("/login");
          return;
        }

        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists() || userSnap.data().role !== "admin") {
          navigate("/login");
          return;
        }

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

  const handleApprove = async (provider) => {
    setActionLoading(provider.id);
    try {
      await approveProvider(provider.id, provider);
      setProviders((prev) => prev.filter((p) => p.id !== provider.id));
      setStats((prev) => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1,  
        totalProviders:   prev.totalProviders + 1,
      }));
    } catch (err) {
      console.error("Approve failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (provider) => {
    setActionLoading(provider.id);
    try {
      await rejectProvider(provider.id);
      setProviders((prev) => prev.filter((p) => p.id !== provider.id));
      setStats((prev) => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1,  // ✅ keep stats in sync
      }));
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
          <h2>Total Opportunities</h2>
          <p className="number">{stats.totalOpportunities}</p>
        </article>
        <article className="card">
          <h2>Pending Approvals</h2>
          <p className="number">{stats.pendingApprovals}</p>
        </article>
        <article className="card">
          <h2>Total Providers</h2>
          <p className="number">{stats.totalProviders}</p>
        </article>
      </section>

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
                    onClick={() => handleApprove(provider)}
                    disabled={actionLoading === provider.id}
                  >
                    {actionLoading === provider.id ? "..." : "Approve"}
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleReject(provider)}
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