import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../firebase";
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    orderBy,
    writeBatch
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const TYPE_COLORS = {
    status_update:   "#1D9E75",
    new_opportunity: "#185FA5",
    closing_soon:    "#BA7517",
};

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen]                   = useState(false);
    const ref                               = useRef();
    const navigate                          = useNavigate();

    useEffect(() => {
        let unsubscribeSnapshot = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                setNotifications([]);
                return;
            }

            const q = query(
                collection(db, "notifications"),
                where("userId", "==", user.uid),
                orderBy("createdAt", "desc")
            );

            unsubscribeSnapshot = onSnapshot(
                q,
                (snap) => {
                    setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                },
                (error) => {
                    console.error("Notification snapshot error:", error);
                }
            );
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const unread = notifications.filter(n => !n.read).length;

    const handleNotificationClick = async (notification) => {
        // Mark as read
        await updateDoc(doc(db, "notifications", notification.id), { read: true });
        // Close dropdown
        setOpen(false);
        // Navigate to full screen view passing the notification id
        navigate(`/dashboard/applicant/notifications/${notification.id}`);
    };

    const markAllRead = async () => {
        const batch = writeBatch(db);
        notifications
            .filter(n => !n.read)
            .forEach(n => batch.update(doc(db, "notifications", n.id), { read: true }));
        await batch.commit();
    };

    return (
        <aside ref={ref} style={{ position: "relative", display: "inline-block" }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    position: "relative", background: "none",
                    border: "none", cursor: "pointer", fontSize: "1.5rem", padding: "0.25rem"
                }}
                aria-label="Notifications"
            >
                🔔
                {unread > 0 && (
                    <mark style={{
                        position: "absolute", top: 0, right: 0,
                        background: "#D85A30", color: "#fff",
                        borderRadius: "50%", fontSize: "0.6rem",
                        width: 16, height: 16,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700
                    }}>
                        {unread > 9 ? "9+" : unread}
                    </mark>
                )}
            </button>

            {open && (
                <section style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    background: "#fff", border: "1px solid #e0e0e0",
                    borderRadius: 10, width: 320, maxHeight: 400,
                    overflowY: "auto", zIndex: 999,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.12)"
                }}>
                    <header style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", padding: "0.75rem 1rem",
                        borderBottom: "1px solid #eee",
                        position: "sticky", top: 0, background: "#fff"
                    }}>
                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                            Notifications {unread > 0 && `(${unread})`}
                        </span>
                        {unread > 0 && (
                            <button onClick={markAllRead} style={{
                                fontSize: "0.75rem", color: "#1D9E75",
                                background: "none", border: "none", cursor: "pointer"
                            }}>
                                Mark all read
                            </button>
                        )}
                    </header>

                    {notifications.length === 0 ? (
                        <p style={{ padding: "1.5rem", textAlign: "center", color: "#888", fontSize: "0.85rem" }}>
                            No notifications yet
                        </p>
                    ) : (
                        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                            {notifications.map(n => (
                                <li
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    style={{
                                        padding: "0.75rem 1rem",
                                        borderBottom: "1px solid #f5f5f5",
                                        background: n.read ? "transparent" : "#f0f9f5",
                                        cursor: "pointer",
                                        borderLeft: `3px solid ${n.read ? "transparent" : TYPE_COLORS[n.type] || "#1D9E75"}`
                                    }}
                                >
                                    <p style={{ margin: 0, fontWeight: n.read ? 400 : 600, fontSize: "0.875rem" }}>
                                        {n.title}
                                    </p>
                                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "#777", lineHeight: 1.4 }}>
                                        {n.body}
                                    </p>
                                    {n.createdAt && (
                                        <time style={{ display: "block", marginTop: "0.2rem", fontSize: "0.7rem", color: "#aaa" }}>
                                            {n.createdAt.toDate().toLocaleDateString()}
                                        </time>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}
        </aside>
    );
}