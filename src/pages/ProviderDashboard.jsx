import { useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import OverviewCards from "../components/OverviewCards";
import ListingsPanel from "../components/ListingsPanel";
import ApplicationsPanel from "../components/ApplicationsPanel";
import CreateOpportunityForm from "../components/CreateOpportunityForm";

export default function ProviderDashboard() {
  const [tab, setTab] = useState("overview");

  return (
    <main style={{
      display: "flex",
      minHeight: "100vh",
      background: "#f4f6f8",
      fontFamily: "Arial"
    }}>

      {/* Sidebar */}
      <Sidebar setTab={setTab} />

      {/* Main Content Area */}
      <section style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
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