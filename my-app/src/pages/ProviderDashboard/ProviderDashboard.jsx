import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../services/firebase";
import { signOut } from "firebase/auth";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import OverviewCards from "./components/OverviewCards";
import ListingsPanel from "./components/ListingsPanel";
import ApplicationsPanel from "./components/ApplicationsPanel";
import CreateOpportunityForm from "./components/CreateOpportunityForm";
import "./ProviderDashboard.css";

export default function ProviderDashboard() {
  const [tab, setTab] = useState("overview");
  const [providerName, setProviderName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }
    setProviderName(user.displayName || user.email);
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <main className="provider-dashboard">
      <Sidebar setTab={setTab} activeTab={tab} />

      <section className="provider-dashboard__content">
        <Navbar providerName={providerName} onLogout={handleLogout} />

        <section className="provider-dashboard__body">
          <section className="provider-dashboard__panel">
            {tab === "overview" && <OverviewCards />}
            {tab === "listings" && <ListingsPanel />}
            {tab === "applications" && <ApplicationsPanel />}
            {tab === "create" && <CreateOpportunityForm />}
          </section>
        </section>
      </section>
    </main>
  );
}
