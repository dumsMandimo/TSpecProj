import { useState, useEffect } from "react";
import {
  subscribeToProviderNotifications,
  markNotificationRead,
} from "../../../services/providerService";
import { auth } from "../../../services/firebase";
import "./NotificationsPanel.css";

const TYPE_LABELS = {
  new_application:  "New Application",
  status_update:    "Status Update",
  listing_approved: "Listing Approved",
  listing_rejected: "Listing Rejected",
  account_approved: "Account Approved",
  account_rejected: "Account Rejected",
};

const TYPE_ICON = {
  new_application:  "🧑‍💼",
  status_update:    "📋",
  listing_approved: "✅",
  listing_rejected: "❌",
  account_approved: "🎉",
  account_rejected: "⚠️",
};

function timeAgo(timestamp) {
  if (!timestamp) return "";
  const date  = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [filter, setFilter]               = useState("all");

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribe = subscribeToProviderNotifications(
      uid,
      (data) => { setNotifications(data); setLoading(false); },
      ()     => { setError("Failed to load notifications."); setLoading(false); }
    );

    return () => unsubscribe();
  }, []);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markNotificationRead(n.id)));
  };

  const visible = filter === "all"
    ? notifications
    : filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications.filter((n) => n.type === filter);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <p className="notifications-panel__loading">Loading notifications...</p>;
  if (error)   return <p className="notifications-panel__error" role="alert">{error}</p>;

  return (
    <section aria-label="Notifications">
      <header className="notifications-panel__header">
        <div className="notifications-panel__title-row">
          <h2 className="notifications-panel__title">
            Notifications
            {unreadCount > 0 && (
              <span className="notifications-panel__badge">{unreadCount}</span>
            )}
          </h2>
          {unreadCount > 0 && (
            <button
              className="notifications-panel__mark-all"
              onClick={handleMarkAllRead}
              type="button"
            >
              Mark all as read
            </button>
          )}
        </div>
        <p className="notifications-panel__subtitle">Stay updated on your listings and applications</p>
      </header>

      <nav className="notifications-panel__filters" aria-label="Filter notifications">
        {[
          { key: "all",              label: "All" },
          { key: "unread",           label: "Unread" },
          { key: "new_application",  label: "Applications" },
          { key: "listing_approved", label: "Approved" },
          { key: "listing_rejected", label: "Rejected" },
          { key: "account_approved", label: "Account" },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`notifications-panel__filter-btn${filter === key ? " notifications-panel__filter-btn--active" : ""}`}
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
          >
            {label}
            {key === "unread" && unreadCount > 0 && (
              <span className="notifications-panel__filter-count">{unreadCount}</span>
            )}
          </button>
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className="notifications-panel__empty">No notifications here yet.</p>
      ) : (
        <ul className="notifications-panel__list">
          {visible.map((n) => (
            <li
              key={n.id}
              className={`notification-card${n.read ? "" : " notification-card--unread"}`}
            >
              <span className="notification-card__icon" aria-hidden="true">
                {TYPE_ICON[n.type] ?? "🔔"}
              </span>

              <div className="notification-card__body">
                <p className="notification-card__title">{n.title}</p>
                <p className="notification-card__message">{n.body}</p>
                <footer className="notification-card__footer">
                  <time className="notification-card__time" dateTime={n.createdAt?.toDate?.()?.toISOString()}>
                    {timeAgo(n.createdAt)}
                  </time>
                  {n.type && (
                    <span className={`notification-card__type notification-card__type--${n.type}`}>
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                  )}
                </footer>
              </div>

              {!n.read && (
                <button
                  className="notification-card__read-btn"
                  onClick={() => handleMarkRead(n.id)}
                  type="button"
                  aria-label="Mark as read"
                >
                  ✓
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}