// src/pages/admin/Opportunities.jsx
import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import './opportunities.css';
    
export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOpportunities();
  }, []);

  async function fetchOpportunities() {
    try {
      setLoading(true);
      const q = query(collection(db, 'opportunities'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOpportunities(data);
    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
      setError('Failed to load opportunities.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await updateDoc(doc(db, 'opportunities', id), { status: newStatus });
      setOpportunities(prev =>
        prev.map(opp => opp.id === id ? { ...opp, status: newStatus } : opp)
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    }
  }

  const filtered = filter === 'all'
    ? opportunities
    : opportunities.filter(opp => opp.status === filter);

  const pendingCount = opportunities.filter(o => o.status === 'pending').length;

  if (loading) {
    return (
      <main>
        <p role="status">Loading opportunities...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <p role="alert">{error}</p>
      </main>
    );
  }

  return (
    <main className="opportunities-page">

      <header className="page-header">
        <h1>Opportunities</h1>
        <p className="page-subheading">
          <strong>{opportunities.length}</strong> total &mdash;{' '}
          <strong>{pendingCount}</strong> pending approval
        </p>
      </header>

      {/* Filter nav */}
      <nav aria-label="Filter opportunities by status">
        <ul className="filter-list" role="list">
          {['all', 'pending', 'approved', 'removed'].map(f => (
            <li key={f}>
              <button
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Results */}
      <section aria-label="Opportunities list">
        {filtered.length === 0 ? (
          <p className="empty-state">No {filter === 'all' ? '' : filter} opportunities found.</p>
        ) : (
          <table className="opportunities-table">
            <caption className="sr-only">
              List of {filter} opportunities with approval actions
            </caption>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Location</th>
                <th scope="col">NQF Level</th>
                <th scope="col">Closing Date</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(opp => (
                <tr key={opp.id}>
                  <td>{opp.title}</td>
                  <td>{opp.location}</td>
                  <td>{opp.nqfLevel}</td>
                  <td>
                    <time dateTime={opp.closingDate}>{opp.closingDate}</time>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${opp.status}`}>
                      {opp.status}
                    </span>
                  </td>
                  <td>
                    <menu className="action-menu">
                      {opp.status === 'pending' && (
                        <>
                          <li>
                            <button
                              className="action-btn action-btn--approve"
                              onClick={() => handleStatusChange(opp.id, 'approved')}
                              aria-label={`Approve ${opp.title}`}
                            >
                              Approve
                            </button>
                          </li>
                          <li>
                            <button
                              className="action-btn action-btn--remove"
                              onClick={() => handleStatusChange(opp.id, 'removed')}
                              aria-label={`Remove ${opp.title}`}
                            >
                              Remove
                            </button>
                          </li>
                        </>
                      )}
                      {opp.status === 'approved' && (
                        <li>
                          <button
                            className="action-btn action-btn--remove"
                            onClick={() => handleStatusChange(opp.id, 'removed')}
                            aria-label={`Remove ${opp.title}`}
                          >
                            Remove
                          </button>
                        </li>
                      )}
                      {opp.status === 'removed' && (
                        <li>
                          <button
                            className="action-btn action-btn--approve"
                            onClick={() => handleStatusChange(opp.id, 'approved')}
                            aria-label={`Restore ${opp.title}`}
                          >
                            Restore
                          </button>
                        </li>
                      )}
                    </menu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

    </main>
  );
}