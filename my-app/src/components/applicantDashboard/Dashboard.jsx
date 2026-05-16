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

                const today      = new Date();
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);

                for (const oppDoc of oppsSnap.docs) {
                    const opp = oppDoc.data();

                    
                    if (appliedOpportunityIds.includes(oppDoc.id)) continue;

                    
                    if (!opp.closingDate) continue;

                    
                    const closing  = new Date(opp.closingDate);
                    const diffMs   = closing - today;
                    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                    
                    if (diffDays < 0 || diffDays > DAYS_BEFORE) continue;

                    
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

    
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (!user) return;

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

                for (const oppDoc of oppsSnap.docs) {
                    const opp = oppDoc.data();

                    
                    if (appliedOpportunityIds.includes(oppDoc.id)) continue;

                    
                    const existingSnap = await getDocs(query(
                        collection(db, "notifications"),
                        where("userId",        "==", user.uid),
                        where("type",          "==", "new_opportunity"),
                        where("opportunityId", "==", oppDoc.id)
                    ));

                    
                    if (!existingSnap.empty) continue;

                    
                    await addDoc(collection(db, "notifications"), {
                        userId:        user.uid,
                        title:         "New opportunity available!",
                        body:          `${opp.title} at ${opp.company || opp.companyName || "a provider"} is now open for applications. Apply before ${opp.closingDate || "the closing date"}!`,
                        read:          false,
                        type:          "new_opportunity",
                        opportunityId: oppDoc.id,
                        createdAt:     Timestamp.now(),
                    });

                    console.log(`New opportunity notification sent for: ${opp.title}`);
                }
            } catch (err) {
                console.error("Error checking new opportunities:", err);
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