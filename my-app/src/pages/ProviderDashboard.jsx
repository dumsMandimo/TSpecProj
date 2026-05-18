import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import Sidebar from "../components/Sidebar";
import OverviewCards from "../components/OverviewCards";
import ListingsPanel from "../components/ListingsPanel";
import ApplicationsPanel from "../components/ApplicationsPanel";
import CreateOpportunityForm from "../components/CreateOpportunityForm";
import "./ProviderDashboard.css";

const TAB_LABELS = {
  overview: "Overview",
  listings: "Listings",
  applications: "Applications",
  create: "Post Opportunity",
};

export default function ProviderDashboard() {
  const [tab, setTab] = useState("overview");
  const [providerName, setProviderName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        setProviderName(userSnap.data().name || user.displayName || "there");
      } else {
        setProviderName(user.displayName || "there");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <main className="provider-dashboard">
      <Sidebar activeTab={tab} setTab={setTab} />

      <div className="provider-dashboard__main">
        <header className="provider-dashboard__header">
          <div className="provider-dashboard__brand">
            <p className="provider-dashboard__eyebrow">Provider Portal</p>
            <h1 className="provider-dashboard__title">
              {TAB_LABELS[tab] || "Provider Dashboard"}
            </h1>
          </div>
          <nav className="provider-dashboard__actions" aria-label="Account actions">
            {providerName && (
              <span className="provider-dashboard__greeting">
                Welcome, <strong>{providerName}</strong>
              </span>
            )}
            <button
              type="button"
              className="provider-dashboard__logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </nav>
        </header>

        <div className="provider-dashboard__content">
          <section className="dash-panel" aria-label={TAB_LABELS[tab]}>
            {tab === "overview" && <OverviewCards setTab={setTab} />}
            {tab === "listings" && <ListingsPanel />}
            {tab === "applications" && <ApplicationsPanel />}
            {tab === "create" && <CreateOpportunityForm />}
          </section>
        </div>
      </div>
    </main>
  );
}
