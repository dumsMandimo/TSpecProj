// Dashboard.jsx (Applicant side)
import "./Dashboard.css";
import MyApplications from "./MyApplications";
import OpportunityList from "./OpportunityList";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { subscribeToOpportunities, subscribeToMyApplications } from "../../services/userService";

function Dashboard() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    // 1. Check if logged in
    const user = window.firebaseAuth?.currentUser; // if you still want auth check
    if (!user) {
      navigate("/login");
      return;
    }

    // 2. Real-time listener — applicant sees new provider listings instantly
    const unsubOpportunities = subscribeToOpportunities(
      (data) => setOpportunities(data),
      (err) => console.error("Opportunities error:", err)
    );

    // 3. Real-time listener — applicant sees their own application status updates instantly
    const unsubApplications = subscribeToMyApplications(
      (data) => setApplications(data),
      (err) => console.error("Applications error:", err)
    );

    // 4. Cleanup listeners on unmount
    return () => {
      unsubOpportunities();
      unsubApplications();
    };
  }, [navigate]);

  return (
    <main className="dashboard-page">
      {/* Applicant's own submitted applications + status tracking */}
      <MyApplications applications={applications} />

      {/* All opportunities posted by providers */}
      <OpportunityList opportunities={opportunities} />

      <button
        className="profile-button"
        onClick={() => navigate("/dashboard/myProfile")}
      >
        My Profile
      </button>
    </main>
  );
}

export default Dashboard;