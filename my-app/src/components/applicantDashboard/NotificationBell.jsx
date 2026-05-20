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
    status_update:   "#2ecc71",
    new_opportunity: "#4a9eff",
    closing_soon:    "#ff8a1f",
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
        await updateDoc(doc(db, "notifications", notification.id), { read: true });
        setOpen(false);
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
                    position: "relative",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1.5rem",
                    padding: "0.25rem",
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
                        fontWeight: 700,
                    }}>
                        {unread > 9 ? "9+" : unread}
                    </mark>
                )}
            </button>

            {open && (
                <section style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    background: "#121212",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    width: 340,
                    maxHeight: 420,
                    overflowY: "auto",
                    zIndex: 999,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
                }}>
                    <header style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.85rem 1rem",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        position: "sticky",
                        top: 0,
                        background: "#121212",
                    }}>
                        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#ffffff" }}>
                            Notifications {unread > 0 && (
                                <mark style={{
                                    background: "#ff8a1f",
                                    color: "#111",
                                    borderRadius: 20,
                                    padding: "0.1rem 0.45rem",
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    marginLeft: "0.4rem",
                                }}>
                                    {unread}
                                </mark>
                            )}
                        </span>
                        {unread > 0 && (
                            <button onClick={markAllRead} style={{
                                fontSize: "0.75rem",
                                color: "#ff8a1f",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 500,
                            }}>
                                Mark all read
                            </button>
                        )}
                    </header>

                    {notifications.length === 0 ? (
                        <p style={{
                            padding: "1.5rem",
                            textAlign: "center",
                            color: "rgba(255,255,255,0.4)",
                            fontSize: "0.85rem",
                            margin: 0,
                        }}>
                            No notifications yet
                        </p>
                    ) : (
                        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                            {notifications.map(n => (
                                <li
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    style={{
                                        padding: "0.85rem 1rem",
                                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                                        background: n.read ? "transparent" : "rgba(255,138,31,0.06)",
                                        cursor: "pointer",
                                        borderLeft: `3px solid ${n.read ? "transparent" : (TYPE_COLORS[n.type] || "#ff8a1f")}`,
                                        transition: "background 0.15s ease",
                                    }}
                                >
                                    <p style={{
                                        margin: 0,
                                        fontWeight: n.read ? 400 : 600,
                                        fontSize: "0.875rem",
                                        color: "#ffffff",
                                        lineHeight: 1.4,
                                    }}>
                                        {n.title}
                                    </p>
                                    <p style={{
                                        margin: "0.3rem 0 0",
                                        fontSize: "0.78rem",
                                        color: "rgba(255,255,255,0.55)",
                                        lineHeight: 1.5,
                                    }}>
                                        {n.body}
                                    </p>
                                    {n.createdAt && (
                                        <time style={{
                                            display: "block",
                                            marginTop: "0.3rem",
                                            fontSize: "0.7rem",
                                            color: "rgba(255,255,255,0.3)",
                                        }}>
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