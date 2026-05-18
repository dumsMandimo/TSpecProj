import "./Dashboard.css";
import MyApplications from "./MyApplications";
import OpportunityList from "./OpportunityList";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { subscribeToOpportunities, subscribeToMyApplications } from "../../services/userService";

function Dashboard() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const unsubOpportunities = subscribeToOpportunities(
      (data) => setOpportunities(data),
      (err) => console.error("Opportunities error:", err)
    );

    const unsubApplications = subscribeToMyApplications(
      (data) => setApplications(data),
      (err) => console.error("Applications error:", err)
    );

    return () => {
      unsubOpportunities();
      unsubApplications();
    };
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        setUserName(userSnap.data().name || user.displayName || "there");
      } else {
        setUserName(user.displayName || "there");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <main className="applicant-dashboard">
      <header className="applicant-dashboard__header">
        <div className="applicant-dashboard__brand">
          <p className="applicant-dashboard__eyebrow">Career Dashboard</p>
          <h1 className="applicant-dashboard__title">Applicant Dashboard</h1>
        </div>
        <nav className="applicant-dashboard__actions" aria-label="Account actions">
          {userName && (
            <span className="applicant-dashboard__greeting">
              Welcome, <strong>{userName}</strong>
            </span>
          )}
          <button
            className="applicant-dashboard__logout-btn"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </nav>
      </header>

      <div className="applicant-dashboard__content">
        <MyApplications applications={applications} />
        <OpportunityList opportunities={opportunities} />
      </div>
    </main>
  );
}

export default Dashboard;
