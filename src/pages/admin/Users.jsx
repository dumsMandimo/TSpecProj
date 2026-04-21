// src/pages/admin/Users.jsx
import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import './Users.css';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Filter by role
  const byRole = filter === 'all'
    ? users
    : users.filter(u => u.role === filter);

  // Filter by search (name or email)
  const filtered = byRole.filter(u => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const term = search.toLowerCase();
    return fullName.includes(term) || u.email.toLowerCase().includes(term);
  });

  // Counts for summary cards
  const totalApplicants = users.filter(u => u.role === 'applicant').length;
  const totalProviders = users.filter(u => u.role === 'provider').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;

  // Format the ISO date string into a readable date
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  if (loading) {
    return (
      <main className="users-page">
        <p role="status">Loading users...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="users-page">
        <p role="alert" className="error-message">{error}</p>
      </main>
    );
  }

  return (
    <main className="users-page">

      <header className="page-header">
        <h1>Users</h1>
        <p className="page-subheading">
          <strong>{users.length}</strong> registered users on the platform
        </p>
      </header>

      {/* Summary cards */}
      <section aria-label="User statistics" className="stats-grid">
        <article className="stat-card">
          <h2>Total Users</h2>
          <p className="stat-number">{users.length}</p>
        </article>
        <article className="stat-card">
          <h2>Applicants</h2>
          <p className="stat-number">{totalApplicants}</p>
        </article>
        <article className="stat-card">
          <h2>Providers</h2>
          <p className="stat-number">{totalProviders}</p>
        </article>
        <article className="stat-card">
          <h2>Admins</h2>
          <p className="stat-number">{totalAdmins}</p>
        </article>
      </section>

      {/* Search and filter controls */}
      <section aria-label="Search and filter users" className="controls">
        <label htmlFor="user-search" className="sr-only">Search users by name or email</label>
        <input
          id="user-search"
          type="search"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />

        <nav aria-label="Filter users by role">
          <ul className="filter-list" role="list">
            {['all', 'applicant', 'provider', 'admin'].map(f => (
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
      </section>

      {/* Users table */}
      <section aria-label="Users list">
        {filtered.length === 0 ? (
          <p className="empty-state">
            No {filter === 'all' ? '' : filter} users found
            {search ? ` matching "${search}"` : ''}.
          </p>
        ) : (
          <table className="users-table">
            <caption className="sr-only">
              List of registered users filtered by {filter}
            </caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Province</th>
                <th scope="col">Qualification</th>
                <th scope="col">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.uid}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>
                    <a href={`mailto:${user.email}`} className="email-link">
                      {user.email}
                    </a>
                  </td>
                  <td>
                    <span className={`role-badge role-badge--${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.province || 'N/A'}</td>
                  <td>{user.qualification || 'N/A'}</td>
                  <td>
                    <time dateTime={user.createdAt}>
                      {formatDate(user.createdAt)}
                    </time>
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