import { useState, useEffect, useCallback } from "react";
import {
  subscribeToProviderListings,
  updateOpportunity,
  deleteOpportunity,
  getApplicationCountsForListings,
  autoCloseExpiredListings,
} from "../../../services/providerService";
import { auth } from "../../../services/firebase";
import "./ListingsPanel.css";

const STATUS_LABELS = {
  approved: "Approved",
  pending:  "Pending",
  closed:   "Closed",
};

const STATUS_COLORS = {
  approved: "green",
  pending:  "amber",
  closed:   "grey",
};

const FILTERS = ["all", "approved", "pending", "closed"];

const today = new Date().toISOString().split("T")[0];

function formatDate(dateStr) {
  if (!dateStr) return null;
  const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isExpired(dateStr) {
  if (!dateStr) return false;
  const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
  return date < new Date();
}

export default function ListingsPanel({ initialFilter = "all" }) {
  const [listings, setListings] = useState([]);
  const [appCounts, setAppCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(initialFilter);
  const [expanded, setExpanded] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    autoCloseExpiredListings(uid).catch(console.error);

    const unsubscribe = subscribeToProviderListings(
      uid,
      async (data) => {
        setListings(data);
        setLoading(false);

        const ids = data.map((l) => l.id);
        const counts = await getApplicationCountsForListings(ids);
        setAppCounts(counts);
      },
      () => {
        setError("Failed to load listings.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const handleEditOpen = (item) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title ?? "",
      location: item.location ?? "",
      stipend: item.stipend ?? "",
      description: item.description ?? "",
      type: item.type ?? "learnership",
      closingDate: item.closingDate ?? "",
    });
    setExpanded(item.id);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async (id) => {
    setSaving(true);
    try {
      await updateOpportunity(id, editForm);
      setEditingId(null);
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async (id) => {
    setDeletingId(id);
    try {
      await deleteOpportunity(id);
      setConfirmDelete(null);
      if (expanded === id) setExpanded(null);
    } catch {
      setError("Failed to delete listing. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const visible =
    filter === "all"
      ? listings
      : listings.filter((l) => l.status === filter);

  if (loading)
    return (
      <section className="lp-loading" aria-label="Loading listings">
        <span className="lp-spinner" />
        <p>Loading your listings…</p>
      </section>
    );

  if (error)
    return (
      <p className="lp-error" role="alert">
        {error}
      </p>
    );

  return (
    <section className="lp" aria-label="My listings">
      <header className="lp__header">
        <section>
          <h2 className="lp__title">My Listings</h2>
          <p className="lp__subtitle">
            Manage all your posted opportunities
          </p>
        </section>

        <aside className="lp__summary" aria-label="Listings summary">
          <span className="lp__summary-chip">
            {listings.length} total
          </span>
        </aside>
      </header>

      <nav className="lp__filters" aria-label="Filter listings">
        {FILTERS.map((f) => {
          const count =
            f === "all"
              ? listings.length
              : listings.filter((l) => l.status === f).length;

          return (
            <button
              key={f}
              className={`lp__filter-btn${
                filter === f ? " lp__filter-btn--active" : ""
              }`}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              type="button"
            >
              {f === "all" ? "All" : STATUS_LABELS[f] ?? f}
              <output className="lp__filter-count">
                {count}
              </output>
            </button>
          );
        })}
      </nav>

      {visible.length === 0 ? (
        <section className="lp__empty">
          <p>
            No{" "}
            {filter !== "all"
              ? (STATUS_LABELS[filter] ?? filter).toLowerCase()
              : ""}{" "}
            listings yet.
          </p>
        </section>
      ) : (
        <ul className="lp__list">
          {visible.map((item) => {
            const isEditing = editingId === item.id;
            const isExpanded = expanded === item.id;
            const appCount = appCounts[item.id] ?? 0;
            const expired = isExpired(item.closingDate);

            return (
              <li key={item.id} className="lp__item">
                <article
                  className={`lc${
                    isExpanded ? " lc--expanded" : ""
                  }`}
                >
                  <header>
                    <button
                      className="lc__summary"
                      onClick={() => {
                        if (isEditing) return;
                        setExpanded(isExpanded ? null : item.id);
                      }}
                      aria-expanded={isExpanded}
                      type="button"
                    >
                      <section className="lc__left">
                        <span
                          className={`lc__status-dot lc__status-dot--${
                            STATUS_COLORS[item.status] ?? "grey"
                          }`}
                          aria-hidden="true"
                        />

                        <section>
                          <h3 className="lc__title">
                            {item.title}
                          </h3>
                          <p className="lc__meta">
                            {item.location}
                            {item.type && (
                              <>
                                {" "}
                                ·{" "}
                                {item.type
                                  .charAt(0)
                                  .toUpperCase() +
                                  item.type.slice(1)}
                              </>
                            )}
                          </p>
                        </section>
                      </section>

                      <section className="lc__right">
                        <span
                          className={`lc__badge lc__badge--${
                            STATUS_COLORS[item.status] ?? "grey"
                          }`}
                        >
                          {STATUS_LABELS[item.status] ??
                            item.status}
                        </span>

                        <output
                          className="lc__app-count"
                          title="Applications received"
                        >
                          👥 {appCount}
                        </output>

                        {expired &&
                          item.status === "approved" && (
                            <span className="lc__expired-tag">
                              Expired
                            </span>
                          )}

                        <span
                          className="lc__chevron"
                          aria-hidden="true"
                        >
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </section>
                    </button>
                  </header>

                  {isExpanded && (
                    <main className="lc__body">
                      {isEditing ? (
                        <form
                          className="lc__edit-form"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleEditSave(item.id);
                          }}
                        >
                          <fieldset className="lc__edit-grid">
                            <legend className="sr-only">
                              Edit listing
                            </legend>

                            <label>
                              Title
                              <input
                                name="title"
                                value={editForm.title}
                                onChange={handleEditChange}
                                required
                              />
                            </label>

                            <label>
                              Type
                              <select
                                name="type"
                                value={editForm.type}
                                onChange={handleEditChange}
                              >
                                <option value="learnership">
                                  Learnership
                                </option>
                                <option value="internship">
                                  Internship
                                </option>
                                <option value="apprenticeship">
                                  Apprenticeship
                                </option>
                                <option value="graduate">
                                  Graduate Programme
                                </option>
                              </select>
                            </label>

                            <label>
                              Location
                              <input
                                name="location"
                                value={editForm.location}
                                onChange={handleEditChange}
                                required
                              />
                            </label>

                            <label>
                              Stipend
                              <input
                                name="stipend"
                                value={editForm.stipend}
                                onChange={handleEditChange}
                              />
                            </label>

                            <label>
                              Closing Date
                              <input
                                type="date"
                                name="closingDate"
                                value={editForm.closingDate}
                                onChange={handleEditChange}
                                min={today}
                              />
                            </label>

                            <label>
                              Description
                              <textarea
                                name="description"
                                value={editForm.description}
                                onChange={handleEditChange}
                                rows={4}
                                required
                              />
                            </label>
                          </fieldset>

                          <footer className="lc__edit-actions">
                            <button type="submit" disabled={saving}>
                              {saving ? "Saving…" : "Save Changes"}
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </footer>
                        </form>
                      ) : (
                        <section className="lc__details">
                          {item.stipend && (
                            <p>
                              <strong>Stipend:</strong>{" "}
                              {item.stipend}
                            </p>
                          )}

                          {item.closingDate && (
                            <p>
                              <strong>Closing Date:</strong>{" "}
                              <span
                                className={
                                  expired
                                    ? "lc__expired-text"
                                    : ""
                                }
                              >
                                {formatDate(item.closingDate)}
                                {expired && " (Expired)"}
                              </span>
                            </p>
                          )}

                          <p>
                            <strong>Applications:</strong>{" "}
                            {appCount} received
                          </p>

                          {item.description && (
                            <section>
                              <strong>Description</strong>
                              <p>{item.description}</p>
                            </section>
                          )}

                          <footer>
                            <button
                              type="button"
                              onClick={() => handleEditOpen(item)}
                            >
                              ✏️ Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDelete(item.id)
                              }
                            >
                              🗑 Delete
                            </button>
                          </footer>

                          {confirmDelete === item.id && (
                            <aside>
                              <p>
                                Are you sure you want to delete{" "}
                                <strong>{item.title}</strong>?
                              </p>

                              <div>
                                <button
                                  onClick={() =>
                                    handleDeleteConfirm(item.id)
                                  }
                                  disabled={
                                    deletingId === item.id
                                  }
                                  type="button"
                                >
                                  {deletingId === item.id
                                    ? "Deleting…"
                                    : "Yes, Delete"}
                                </button>

                                <button
                                  onClick={() =>
                                    setConfirmDelete(null)
                                  }
                                  type="button"
                                >
                                  Cancel
                                </button>
                              </div>
                            </aside>
                          )}
                        </section>
                      )}
                    </main>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}