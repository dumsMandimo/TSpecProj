
import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import './Users.css';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'removed'
  const [search, setSearch] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const currentAdminUid = getAuth().currentUser?.uid;

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

  // UAT-12.2: Soft-delete — set status: "removed" instead of deleting
  async function handleRemove(userId) {
    const confirmed = window.confirm(
      'Are you sure you want to remove this user? They will lose access to the platform.'
    );
    if (!confirmed) return;

    setRemovingId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'removed' });
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, status: 'removed' } : u)
      );
    } catch (err) {
      console.error('Failed to remove user:', err);
      alert('Failed to remove user. Please try again.');
    } finally {
      setRemovingId(null);
    }
  }

  // UAT-12.4: Filter by status tab first
  const byStatus = statusFilter === 'removed'
    ? users.filter(u => u.status === 'removed')
    : users.filter(u => u.status !== 'removed');

  // Then filter by role
  const byRole = roleFilter === 'all'
    ? byStatus
    : byStatus.filter(u => u.role === roleFilter);

  // Then filter by search
  const filtered = byRole.filter(u => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const term = search.toLowerCase();
    return fullName.includes(term) || u.email?.toLowerCase().includes(term);
  });

  // Counts — exclude admins since they are hardcoded
  const activeUsers = users.filter(u => u.status !== 'removed' && u.role !== 'admin');
  const totalApplicants = activeUsers.filter(u => u.role === 'applicant').length;
  const totalProviders = activeUsers.filter(u => u.role === 'provider').length;
  const totalRemoved = users.filter(u => u.status === 'removed').length;

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
          <strong>{activeUsers.length}</strong> registered users on the platform
        </p>
      </header>

      {/* Summary cards */}
      <section aria-label="User statistics" className="stats-grid">
        <article className="stat-card">
          <h2>Total Users</h2>
          <p className="stat-number">{activeUsers.length}</p>
        </article>
        <article className="stat-card">
          <h2>Applicants</h2>
          <p className="stat-number">{totalApplicants}</p>
        </article>
        <article className="stat-card">
          <h2>Providers</h2>
          <p className="stat-number">{totalProviders}</p>
        </article>
        <article className="stat-card stat-card--removed">
          <h2>Removed</h2>
          <p className="stat-number">{totalRemoved}</p>
        </article>
      </section>

      {/* UAT-12.4: Status filter tabs (Active / Removed) */}
      <section aria-label="Filter users by status" className="status-tabs">
        <button
          onClick={() => setStatusFilter('active')}
          aria-pressed={statusFilter === 'active'}
          className={`status-tab ${statusFilter === 'active' ? 'status-tab--active' : ''}`}
        >
          Active
          <span className="tab-count">{activeUsers.length}</span>
        </button>
        <button
          onClick={() => setStatusFilter('removed')}
          aria-pressed={statusFilter === 'removed'}
          className={`status-tab ${statusFilter === 'removed' ? 'status-tab--removed' : ''}`}
        >
          Removed
          <span className="tab-count">{totalRemoved}</span>
        </button>
      </section>

      {/* Search and role filter controls */}
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
            {['all', 'applicant', 'provider'].map(f => (
              <li key={f}>
                <button
                  onClick={() => setRoleFilter(f)}
                  aria-pressed={roleFilter === f}
                  className={`filter-btn ${roleFilter === f ? 'filter-btn--active' : ''}`}
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
            No {roleFilter === 'all' ? '' : roleFilter} users found
            {search ? ` matching "${search}"` : ''}.
          </p>
        ) : (
          <table className="users-table">
            <caption className="sr-only">
              List of {statusFilter} users filtered by {roleFilter}
            </caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Province</th>
                <th scope="col">Qualification</th>
                <th scope="col">Joined</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
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
                  <td>
                    {/* UAT-12.1 & UAT-12.5: Show Remove only for other active users */}
                    {user.id !== currentAdminUid && user.status !== 'removed' && (
                      <button
                        className="remove-btn"
                        onClick={() => handleRemove(user.id)}
                        disabled={removingId === user.id}
                        aria-label={`Remove ${user.firstName} ${user.lastName}`}
                      >
                        {removingId === user.id ? 'Removing...' : 'Remove'}
                      </button>
                    )}
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