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
        <div className="progress-tracker">
            {stages.map((stage, index) => {
                const isActive       = index <= stageIndex;
                const isFinalDecision = stage === "Final Decision";

                const stepClass = [
                    "progress-tracker__step",
                    isActive ? "progress-tracker__step--active" : "",
                ].filter(Boolean).join(" ");

                const dotClass = [
                    "progress-tracker__dot",
                    isActive ? "progress-tracker__dot--active" : "",
                    isFinalDecision && isAccepted    ? "progress-tracker__dot--accepted"    : "",
                    isFinalDecision && isRejected    ? "progress-tracker__dot--rejected"    : "",
                    isFinalDecision && isShortlisted ? "progress-tracker__dot--shortlisted" : "",
                ].filter(Boolean).join(" ");

                const labelClass = [
                    "progress-tracker__label",
                    isActive ? "progress-tracker__label--active" : "",
                ].filter(Boolean).join(" ");

                const label = isFinalDecision
                    ? isAccepted    ? "Accepted"
                    : isRejected    ? "Rejected"
                    : isShortlisted ? "Shortlisted"
                    : "Final Decision"
                    : stage === "Received" && normalized === "Pending"
                    ? "Pending"
                    : stage;

                return (
                    <div key={index} className={stepClass}>
                        <span className={dotClass} />
                        <span className={labelClass}>{label}</span>
                    </div>
                );
            })}
        </div>
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
                        <div className="application-card__header">
                            <h3 className="application-card__title">{application.title}</h3>
                        </div>
                        <div className="application-card__meta">
                            <p className="application-card__company">{application.company}</p>
                        </div>
                        <ProgressTracker status={application.status} />
                    </article>
                ))}
            </section>
        </section>
    );
}

export default MyApplications;