import "./MyApplications.css";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

const stages = ["Submitted", "Received", "Under Evaluation", "Final Decision"];

function ProgressTracker({ stageIndex = 0, status = "" }) {
  const isAccepted    = status === "accepted"    || status === "Accepted";
  const isRejected    = status === "rejected"    || status === "Rejected";
  const isShortlisted = status === "shortlisted" || status === "Shortlisted";

  return (
    <section className="progress-container">
      {stages.map((stage, index) => (
        <article key={index} className="progress-step">
          <span
            className={`circle ${index <= stageIndex ? "active" : ""} ${
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

// ✅ Receives applications as a prop from Dashboard — no internal fetch needed
function MyApplications({ applications = [] }) {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        setUserName(userSnap.data().name || user.displayName || "User");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  return (
    <section className="applications-page">
      <header className="applications-header">
        <p className="eyebrow">Career Dashboard</p>
        <h1 className="applications-title">My Applications</h1>
        <h2 className="applications-subtitle">Welcome back, {userName}</h2>
      </header>

      {applications.length === 0 ? (
        <p className="applications-empty">No applications yet. Browse opportunities below!</p>
      ) : (
        <section className="applications-grid">
          {applications.map((application) => (
            <article key={application.id} className="application-card">
              <h3>{application.title}</h3>           {/* ✅ saved by applyToOpportunity */}
              <p>{application.company}</p>           {/* ✅ saved by applyToOpportunity */}
              <p className="application-card__location">{application.location}</p>
              <p className="application-card__type">{application.type}</p>

              <ProgressTracker
                stageIndex={application.stageIndex ?? 0}
                status={application.status}
              />
            </article>
          ))}
        </section>
      )}
    </section>
  );
}

export default MyApplications;
