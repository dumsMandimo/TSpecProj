import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

const TYPE_COLORS = {
    status_update:   { bg: "#0f1f1a", accent: "#2ecc71", label: "Application Update" },
    new_opportunity: { bg: "#0d1a2b", accent: "#4a9eff", label: "New Opportunity"    },
    closing_soon:    { bg: "#1f1508", accent: "#ff8a1f", label: "Closing Soon"        },
};

export default function NotificationDetail() {
    const { notificationId } = useParams();
    const navigate           = useNavigate();
    const [notification, setNotification] = useState(null);
    const [loading, setLoading]           = useState(true);

    useEffect(() => {
        const fetchNotification = async () => {
            try {
                const snap = await getDoc(doc(db, "notifications", notificationId));
                if (snap.exists()) {
                    setNotification({ id: snap.id, ...snap.data() });
                }
            } catch (err) {
                console.error("Error fetching notification:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotification();
    }, [notificationId]);

    if (loading) return (
        <p style={{ color: "#fff", padding: "2rem", textAlign: "center" }}>Loading...</p>
    );

    if (!notification) return (
        <section style={{ background: "#060606", minHeight: "100vh", padding: "2rem 1rem" }}>
            <p style={{ color: "#fff" }}>Notification not found.</p>
            <button
                onClick={() => navigate(-1)}
                style={{
                    marginTop: "1rem",
                    padding: "0.6rem 1.4rem",
                    background: "#ff8a1f",
                    color: "#111",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 600,
                    cursor: "pointer"
                }}
            >
                Go Back
            </button>
        </section>
    );

    const type    = TYPE_COLORS[notification.type] || TYPE_COLORS.status_update;
    const dateStr = notification.createdAt
        ? notification.createdAt.toDate().toLocaleString()
        : "Unknown time";

    return (
        <main style={{
            background: "#060606",
            minHeight: "100vh",
            padding: "2rem 1rem",
            fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
        }}>
            <section style={{ maxWidth: 600, margin: "0 auto" }}>

                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: "none",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        color: "#a1a1aa",
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.4rem 0.9rem",
                    }}
                >
                    ← Back
                </button>

                <article style={{
                    background: type.bg,
                    borderRadius: 16,
                    padding: "2rem",
                    border: `1px solid ${type.accent}33`,
                    borderLeft: `4px solid ${type.accent}`,
                }}>
                    <header style={{ marginBottom: "1rem" }}>
                        <span style={{
                            background: type.accent,
                            color: "#fff",
                            borderRadius: 20,
                            padding: "0.25rem 0.75rem",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            display: "inline-block",
                        }}>
                            {type.label}
                        </span>
                    </header>

                    <h1 style={{
                        fontSize: "1.4rem",
                        fontWeight: 700,
                        color: "#ffffff",
                        margin: "0 0 0.75rem",
                        lineHeight: 1.3,
                    }}>
                        {notification.title}
                    </h1>

                    <p style={{
                        fontSize: "1rem",
                        lineHeight: 1.7,
                        color: "rgba(255,255,255,0.75)",
                        margin: "0 0 1.5rem",
                    }}>
                        {notification.body}
                    </p>

                    <footer style={{
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        paddingTop: "1rem",
                    }}>
                        <time style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                            Received: {dateStr}
                        </time>
                    </footer>
                </article>

                <button
                    onClick={() => navigate("/dashboard/applicant")}
                    style={{
                        marginTop: "1.5rem",
                        width: "100%",
                        padding: "0.75rem 1rem",
                        background: "#ff8a1f",
                        color: "#111",
                        border: "none",
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                    }}
                >
                    View My Applications
                </button>

            </section>
        </main>
    );
}