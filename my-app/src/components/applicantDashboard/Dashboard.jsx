import "./Dashboard.css";
import MyApplications from "./MyApplications";
import OpportunityList from "./OpportunityList";
import NotificationBell from "./NotificationBell";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
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

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (!user) return;

            try {
                // 1. Get all opportunity IDs the user already applied for
                const appsSnap = await getDocs(query(
                    collection(db, "applications"),
                    where("userId", "==", user.uid)
                ));

                const appliedOpportunityIds = appsSnap.docs.map(d => d.data().opportunityId);

                // 2. Get all approved opportunities
                const oppsSnap = await getDocs(query(
                    collection(db, "opportunities"),
                    where("status", "==", "approved")
                ));

                if (oppsSnap.empty) return;

                const today      = new Date();
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);

                for (const oppDoc of oppsSnap.docs) {
                    const opp = oppDoc.data();

                    // 3. Skip ones they already applied for
                    if (appliedOpportunityIds.includes(oppDoc.id)) continue;

                    // 4. Skip if no closing date
                    if (!opp.closingDate) continue;

                    // 5. Check how many days until closing
                    const closing  = new Date(opp.closingDate);
                    const diffMs   = closing - today;
                    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                    // Only notify if closing within 7 days and not already closed
                    if (diffDays < 0 || diffDays > DAYS_BEFORE) continue;

                    // 6. Check if we already sent this notification today
                    const existingSnap = await getDocs(query(
                        collection(db, "notifications"),
                        where("userId",        "==", user.uid),
                        where("type",          "==", "closing_soon"),
                        where("opportunityId", "==", oppDoc.id)
                    ));

                    const alreadySentToday = existingSnap.docs.some(d => {
                        const createdAt = d.data().createdAt?.toDate();
                        return createdAt && createdAt >= startOfDay;
                    });

                    if (alreadySentToday) continue;

                    // 7. Write the notification
                    await addDoc(collection(db, "notifications"), {
                        userId:        user.uid,
                        title:         "Opportunity closing soon!",
                        body:          `${opp.title} at ${opp.company || opp.companyName || "a provider"} closes in ${diffDays} day${diffDays === 1 ? "" : "s"}. Don't miss out — apply before it's too late!`,
                        read:          false,
                        type:          "closing_soon",
                        opportunityId: oppDoc.id,
                        createdAt:     Timestamp.now(),
                    });

                    console.log(`Closing soon notification sent for: ${opp.title}`);
                }
            } catch (err) {
                console.error("Error checking closing dates:", err);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    return (
        <main className="dashboard-page">
            <header style={{ display: "flex", justifyContent: "flex-end", padding: "1rem" }}>
                <NotificationBell />
            </header>

            <MyApplications />
            <OpportunityList />

            <button
                className="profile-button"
                onClick={() => navigate("/dashboard/applicant/myProfile")}
            >
                My Profile
            </button>
        </main>
    );
}

export default Dashboard;