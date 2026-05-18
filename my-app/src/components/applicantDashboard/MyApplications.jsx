import { useEffect, useState, useRef } from "react";
import {
    collection,
    doc,
    query,
    where,
    getDoc,
    onSnapshot,
    addDoc,
    Timestamp
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./MyApplications.css";

const stages = ["Submitted", "Received", "Under Evaluation", "Final Decision"];

function normalizeStatus(status = "") {
    if (!status) return "";
    const lower = status.toLowerCase();
    if (lower === "under evaluation") return "Under evaluation";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function getStageIndex(status) {
    switch (normalizeStatus(status)) {
        case "Submitted":        return 0;
        case "Received":         return 1;
        case "Pending":          return 1;
        case "Under evaluation": return 2;
        case "Shortlisted":      return 3;
        case "Accepted":         return 3;
        case "Rejected":         return 3;
        default:                 return 0;
    }
}

const STATUS_MESSAGES = {
    "Received":          "Your application has been received and is under review.",
    "Pending":           "Your application is pending review.",
    "Under evaluation":  "Your application is currently being evaluated.",
    "Shortlisted":       "Great news! You have been shortlisted.",
    "Accepted":          "Congratulations! Your application has been accepted.",
    "Rejected":          "Unfortunately your application was not successful this time.",
};

function ProgressTracker({ status = "" }) {
    const normalized    = normalizeStatus(status);
    const stageIndex    = getStageIndex(status);
    const isAccepted    = normalized === "Accepted";
    const isRejected    = normalized === "Rejected";
    const isShortlisted = normalized === "Shortlisted";

    return (
        <section className="progress-container">
            {stages.map((stage, index) => (
                <article key={index} className="progress-step">
                    <span
                        className={`circle ${
                            index <= stageIndex ? "active" : ""
                        } ${
                            stage === "Final Decision" && isAccepted
                                ? "accepted"
                                : stage === "Final Decision" && isRejected
                                ? "rejected"
                                : stage === "Final Decision" && isShortlisted
                                ? "shortlisted"
                                : ""
                        }`}
                    />
                    <span className="stage-label">
                        {stage === "Final Decision"
                            ? isAccepted
                                ? "Accepted"
                                : isRejected
                                ? "Rejected"
                                : isShortlisted
                                ? "Shortlisted"
                                : "Final Decision"
                            : stage === "Received" && normalized === "Pending"
                            ? "Pending"
                            : stage}
                    </span>
                </article>
            ))}
        </section>
    );
}

function MyApplications() {
    const [applications, setApplications] = useState([]);
    const [userName, setUserName]         = useState("");
    const prevApplicationsRef             = useRef([]);

    useEffect(() => {
        let unsubscribeSnapshot = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setApplications([]);
                return;
            }

            const q = query(
                collection(db, "applications"),
                where("userId", "==", user.uid)
            );

            unsubscribeSnapshot = onSnapshot(
                q,
                async (snapshot) => {
                    const apps = snapshot.docs.map((d) => ({
                        id: d.id,
                        ...d.data()
                    }));

                    for (const app of apps) {
                        const prev = prevApplicationsRef.current.find(
                            p => p.id === app.id
                        );

                        const statusChanged = prev &&
                            normalizeStatus(prev.status) !== normalizeStatus(app.status);
                        const hasMessage = STATUS_MESSAGES[normalizeStatus(app.status)];

                        if (statusChanged && hasMessage) {
                            try {
                                await addDoc(collection(db, "notifications"), {
                                    userId:        user.uid,
                                    title:         `Application ${normalizeStatus(app.status)}`,
                                    body:          `${app.title}: ${hasMessage}`,
                                    read:          false,
                                    type:          "status_update",
                                    applicationId: app.id,
                                    createdAt:     Timestamp.now(),
                                });
                            } catch (err) {
                                console.error("Failed to write notification:", err);
                            }
                        }
                    }

                    prevApplicationsRef.current = apps;
                    setApplications(apps);
                },
                (error) => {
                    console.error("Snapshot error:", error);
                }
            );

            const userSnap = await getDoc(doc(db, "applicants", user.uid));
            if (userSnap.exists()) {
                setUserName(userSnap.data().name || "User");
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, []);

    return (
        <section className="applications-page">
            <header className="applications-header">
                <p className="eyebrow">Career Dashboard</p>
                <h1 className="applications-title">My Applications</h1>
                <h2 className="applications-subtitle">Welcome back, {userName}</h2>
            </header>

            <section className="applications-grid">
                {applications.length === 0 && (
                    <p>You have not applied to any opportunities yet.</p>
                )}
                {applications.map((application) => (
                    <article key={application.id} className="application-card">
                        <h3>{application.title}</h3>
                        <p>{application.company}</p>
                        <ProgressTracker status={application.status} />
                    </article>
                ))}
            </section>
        </section>
    );
}

export default MyApplications;