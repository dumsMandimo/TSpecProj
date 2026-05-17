import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./services/firebase";       
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";         
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

    const checkStatus = async () => {                          
      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        navigate("/login");
        return;
      }

      const { status, role } = snap.data();

      if (role !== "provider") {
        navigate("/login");
        return;
      }

      if (status === "pending") {
        navigate("/pending-approval");
        return;
      }

      if (status === "rejected") {
        navigate("/login");
        return;
      }

      setProviderName(user.displayName || user.email);
    };

    checkStatus();
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
            {tab === "overview" && <OverviewCards setTab={setTab} />}
            {tab === "listings" && <ListingsPanel />}
            {tab === "applications" && <ApplicationsPanel />}
            {tab === "create" && <CreateOpportunityForm />}
          </section>
        </section>
      </section>
    </main>
  );
}