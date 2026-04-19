import { useEffect, useState } from "react";
import {
    collection,
    doc,
    updateDoc,
    query,
    where,
    getDoc,
    onSnapshot
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./MyApplications.css";


const stages = ["Submitted", "Received", "Under Evaluation", "Final Decision"];


function ProgressTracker({ stageIndex = 0, status = "" }) {
    const isAccepted = status === "Accepted";
    const isRejected = status === "Rejected";
    const isShortlisted = status === "Shortlisted";

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
                            : stage}
                    </span>
                </article>
            ))}
        </section>
    );
}

function MyApplications() {
    const [applications, setApplications] = useState([]);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        let unsubscribeSnapshot = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (!user) return;

           
            const q = query(
                collection(db, "applications"),
                where("userId", "==", user.uid)
            );

            unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                const apps = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setApplications(apps);
            });

           
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                setUserName(userSnap.data().name || "User");
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, []);

   
    const updateApplicationStatus = async (applicationId, newStatus) => {
        const applicationRef = doc(db, "applications", applicationId);

        let stageIndex;
        if (newStatus === "Accepted" || newStatus === "Rejected") {
            stageIndex = stages.indexOf("Final Decision");
        } else {
            stageIndex = stages.indexOf(newStatus);
        }

        try {
            await updateDoc(applicationRef, {
                status: newStatus,
                stageIndex
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    }

    return (
        <section className="applications-page">
            <header className="applications-header">
                <p className="eyebrow">Career Dashboard</p>
                <h1 className="applications-title">My Applications</h1>
                <h2 className="applications-subtitle">
                    Welcome back, {userName}
                </h2>
            </header>

            <section className="applications-grid">
                {applications.map((application) => (
                    <article key={application.id} className="application-card">
                        <h3>{application.title}</h3>
                        <p>{application.company}</p>

                        <ProgressTracker
                            stageIndex={application.stageIndex ?? 0}
                            status={application.status}
                        />

                        
                    </article>
                ))}
            </section>
        </section>
    );
}

export default MyApplications;
