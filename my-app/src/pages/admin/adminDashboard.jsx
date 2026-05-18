import { useEffect, useState } from "react";
import "./adminStyle.css";
import { getAdminDashboard, getPendingProviders, approveProvider, rejectProvider } from "../../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [data, pendingProviders] = await Promise.all([
          getAdminDashboard(),
          getPendingProviders(),
        ]);
        setStats(data);
        setProviders(pendingProviders);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleApprove = async (provider) => {                                  
    setActionLoading(provider.id);                                             
    try {
      await approveProvider(provider.id, provider);                           
      setProviders((prev) => prev.filter((p) => p.id !== provider.id));       
    } catch (error) {
      console.error("Approve failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (provider) => {                                   
    setActionLoading(provider.id);                                           
    try {
      await rejectProvider(provider.id);
      setProviders((prev) => prev.filter((p) => p.id !== provider.id));      
    } catch (error) {
      console.error("Reject failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

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