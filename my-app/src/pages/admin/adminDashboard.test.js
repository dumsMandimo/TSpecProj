// adminDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./adminStyle.css";
import { getAdminDashboard, getPendingProviders, approveProvider, rejectProvider } from "../../services/api";
import { auth, db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";

function getInitials(name = "") {
  return name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function getDate() {
  return new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalOpportunities: 0, pendingApprovals: 0, totalProviders: 0 });
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [adminName, setAdminName] = useState("Admin");

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

        const data = userSnap.data();
        if (data.name) setAdminName(data.name);

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
        totalProviders: prev.totalProviders + 1,
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
        pendingApprovals: prev.pendingApprovals - 1,
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

      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-left">
          <h1>Admin Dashboard</h1>
          <p>{getDate()}</p>
        </div>
        <div className="admin-pill">
          <div className="admin-avatar">{getInitials(adminName)}</div>
          <span>{adminName}</span>
        </div>
      </div>

      {/* Stat cards */}
      <section className="cardContainer">
        <article className="card">
          <div className="card-accent" />
          <h2>Total Opportunities</h2>
          <p className="number">{stats.totalOpportunities}</p>
          <p className="card-sub">Active listings</p>
        </article>
        <article className="card">
          <div className="card-accent" />
          <h2>Pending Approvals</h2>
          <p className="number">{stats.pendingApprovals}</p>
          <p className="card-sub">Awaiting review</p>
        </article>
        <article className="card">
          <div className="card-accent" />
          <h2>Total Providers</h2>
          <p className="number">{stats.totalProviders}</p>
          <p className="card-sub">Approved providers</p>
        </article>
      </section>

      {/* Pending providers */}
      <section className="providers-section">
        <h2 className="providers-heading">
          Pending Providers
          {providers.length > 0 && (
            <span className="providers-badge">{providers.length} awaiting</span>
          )}
        </h2>

        {providers.length === 0 ? (
          <p className="providers-empty">No providers pending approval.</p>
        ) : (
          <div className="providers-list">
            {providers.map((provider) => (
              <article key={provider.id} className="provider-card">
                <div className="provider-initials">
                  {getInitials(provider.organisationName)}
                </div>
                <div className="provider-info">
                  <p className="provider-name">{provider.organisationName}</p>
                  <div className="provider-meta">
                    <span>{provider.contactName}</span>
                    <span className="meta-dot" />
                    <span>{provider.sector}</span>
                    <span className="meta-dot" />
                    <span>{provider.province}</span>
                  </div>
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