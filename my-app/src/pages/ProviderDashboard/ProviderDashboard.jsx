import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../services/firebase";       
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";         
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import OverviewCards from "./components/OverviewCards";
import ListingsPanel from "./components/ListingsPanel";
import ApplicationsPanel from "./components/ApplicationsPanel";
import NotificationsPanel from "./components/NotificationsPanel";
import CreateOpportunityForm from "./components/CreateOpportunityForm";
import { subscribeToProviderNotifications } from "../../services/providerService";
import { useProviderWatcher } from "./hooks/useProviderWatcher";
import "./ProviderDashboard.css";

export default function ProviderDashboard() {
  const [tab, setTab]                             = useState("overview");
  const [providerName, setProviderName]           = useState("");
  const [providerUid, setProviderUid]             = useState(null);
  const [listingFilter, setListingFilter]         = useState("all");
  const [applicationFilter, setApplicationFilter] = useState("all");
  const [unreadCount, setUnreadCount]             = useState(0);
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

    setProviderName(user.displayName || user.email || "Provider");
    setProviderUid(user.uid);
  };

  checkStatus();
}, [navigate]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsubscribe = subscribeToProviderNotifications(
      uid,
      (notifications) => setUnreadCount(notifications.filter((n) => !n.read).length),
      () => {}
    );
    return () => unsubscribe();
  }, []);

  useProviderWatcher(providerUid);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
  };

  return (
    <main className="provider-dashboard">
      <Sidebar setTab={handleTabChange} activeTab={tab} unreadCount={unreadCount} />
      <section className="provider-dashboard__content">
        <Navbar providerName={providerName} onLogout={handleLogout} />
        <section className="provider-dashboard__body">
          <section className="provider-dashboard__panel">
            {tab === "overview" && (
              <OverviewCards
                setTab={handleTabChange}
                setListingFilter={setListingFilter}
                setApplicationFilter={setApplicationFilter}
              />
            )}
            {tab === "listings"      && <ListingsPanel      initialFilter={listingFilter} />}
            {tab === "applications"  && <ApplicationsPanel  initialFilter={applicationFilter} />}
            {tab === "notifications" && <NotificationsPanel />}
            {tab === "create"        && <CreateOpportunityForm />}
          </section>
        </section>
      </section>
    </main>
  );
}