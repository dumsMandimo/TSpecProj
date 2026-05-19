import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

const TYPE_COLORS = {
    status_update:   { bg: "#e1f5ee", accent: "#0F6E56", label: "Application Update" },
    new_opportunity: { bg: "#e6f1fb", accent: "#185FA5", label: "New Opportunity"    },
    closing_soon:    { bg: "#faeeda", accent: "#854F0B", label: "Closing Soon"        },
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

    if (loading) return <p className="loading">Loading...</p>;

    if (!notification) return (
        <section className="page">
            <p>Notification not found.</p>
            <button className="button" onClick={() => navigate(-1)}>Go Back</button>
        </section>
    );

    const type    = TYPE_COLORS[notification.type] || TYPE_COLORS.status_update;
    const dateStr = notification.createdAt
        ? notification.createdAt.toDate().toLocaleString()
        : "Unknown time";

    return (
        <section className="page" style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem" }}>
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    background: "none", border: "none",
                    cursor: "pointer", fontSize: "0.9rem",
                    color: "#555", marginBottom: "1.5rem",
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    padding: 0
                }}
            >
                ← Back
            </button>

            {/* Card */}
            <article style={{
                background: type.bg,
                borderRadius: 16,
                padding: "2rem",
                borderLeft: `5px solid ${type.accent}`
            }}>
                {/* Type badge */}
                <header style={{ marginBottom: "1rem" }}>
                    <mark style={{
                        background: type.accent,
                        color: "#fff",
                        borderRadius: 20,
                        padding: "0.25rem 0.75rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        letterSpacing: "0.04em"
                    }}>
                        {type.label}
                    </mark>
                </header>

                {/* Title */}
                <h1 style={{
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: type.accent,
                    margin: "0 0 0.75rem"
                }}>
                    {notification.title}
                </h1>

                {/* Body */}
                <p style={{
                    fontSize: "1rem",
                    lineHeight: 1.7,
                    color: "#333",
                    margin: "0 0 1.5rem"
                }}>
                    {notification.body}
                </p>

                <footer style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "1rem" }}>
                    <time style={{ fontSize: "0.8rem", color: "#777" }}>
                        Received: {dateStr}
                    </time>
                </footer>
            </article>

            {/* Go to my applications */}
            <button
                className="button"
                onClick={() => navigate("/dashboard/applicant")}
                style={{ marginTop: "1.5rem", width: "100%" }}
            >
                View My Applications
            </button>
        </section>
    );
}