import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import OverviewCards from "../components/OverviewCards";
import ListingsPanel from "../components/ListingsPanel";
import ApplicationsPanel from "../components/ApplicationsPanel";
import CreateOpportunityForm from "../components/CreateOpportunityForm";

export default function ProviderDashboard() {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkProvider() {
      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() || userSnap.data().role !== "provider") {
        navigate("/login");
        return;
      }

      setLoading(false);
    }

    checkProvider();
  }, [navigate]);

  if (loading) return <main style={{ padding: "24px" }}><p>Loading...</p></main>;

  return (
    <main
      className="dashboard-theme"
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f4f6f8",
        fontFamily: "Arial"
      }}
    >
      <Sidebar setTab={setTab} />

      <section style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        <Navbar />

        <section style={{
          padding: "24px",
          display: "grid",
          gap: "20px"
        }}>

          <section style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
          }}>
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