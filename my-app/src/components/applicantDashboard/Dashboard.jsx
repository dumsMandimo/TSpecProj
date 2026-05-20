import "./Dashboard.css";
import MyApplications from "./MyApplications";
import OpportunityList from "./OpportunityList";
import NotificationBell from "./NotificationBell";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    Timestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const DAYS_BEFORE = 7;

function Dashboard() {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [opportunities, setOpportunities] = useState([]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                navigate("/login");
                return;
            }

            try {
                const appsSnap = await getDocs(query(
                    collection(db, "applications"),
                    where("userId", "==", user.uid)
                ));
                const appliedOpportunityIds = appsSnap.docs.map(d => d.data().opportunityId);

                const oppsSnap = await getDocs(query(
                    collection(db, "opportunities"),
                    where("status", "==", "approved")
                ));

                if (oppsSnap.empty) return;

                const today = new Date();

                for (const oppDoc of oppsSnap.docs) {
                    const opp = oppDoc.data();

                    if (appliedOpportunityIds.includes(oppDoc.id)) continue;
                    if (!opp.closingDate) continue;

                    const closing  = new Date(opp.closingDate);
                    const diffDays = Math.ceil((closing - today) / (1000 * 60 * 60 * 24));

                    if (diffDays < 0) continue;

                    const type = diffDays <= DAYS_BEFORE ? "closing_soon" : "new_opportunity";

                    const existingSnap = await getDocs(query(
                        collection(db, "notifications"),
                        where("userId", "==", user.uid),
                        where("type", "==", type),
                        where("opportunityId", "==", oppDoc.id)
                    ));

                    if (!existingSnap.empty) continue;

                    await addDoc(collection(db, "notifications"), {
                        userId:        user.uid,
                        title:         type === "closing_soon" ? "Opportunity closing soon!" : "New opportunity available!",
                        body:          type === "closing_soon"
                            ? `${opp.title} at ${opp.company || opp.companyName || "a provider"} closes in ${diffDays} day${diffDays === 1 ? "" : "s"}. Don't miss out!`
                            : `${opp.title} at ${opp.company || opp.companyName || "a provider"} is now open. Apply before ${opp.closingDate}!`,
                        read:          false,
                        type,
                        opportunityId: oppDoc.id,
                        createdAt:     Timestamp.now(),
                    });
                }
            } catch (err) {
                console.error("Error sending notifications:", err);
            }
        });

        return () => unsubscribeAuth();
    }, [navigate]);

    return (
        <main className="applicant-dashboard">
            <header className="applicant-dashboard__topbar">
                <NotificationBell />
            </header>

            <div className="applicant-dashboard__content">
                <MyApplications applications={applications} />
                <OpportunityList opportunities={opportunities} />

                <div className="applicant-dashboard__profile-row">
                    <button
                        className="applicant-dashboard__profile-btn"
                        onClick={() => navigate("/dashboard/applicant/myProfile")}
                    >
                        My Profile
                    </button>
                </div>
            </div>
        </main>
    );
}

export default Dashboard;
