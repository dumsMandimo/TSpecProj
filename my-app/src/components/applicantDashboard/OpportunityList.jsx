import { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import {
    collection,
    getDocs,
    addDoc,
    query,
    where,
    Timestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./OpportunityList.css";

function OpportunityList(props) {
    const [opportunities, setOpportunities] = useState([]);
    const [user, setUser] = useState(null);

    const [fetchedAppliedIds, setFetchedAppliedIds] = useState(new Set());
    const [sessionApplied,    setSessionApplied]    = useState(new Set());

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Reset both sets when the user changes
        setFetchedAppliedIds(new Set());
        setSessionApplied(new Set());
    }, [user]);

    useEffect(() => {
        const fetchOpportunities = async () => {
            try {
                const q = query(
                    collection(db, "opportunities"),
                    where("status", "==", "approved")
                );
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setOpportunities(data);
            } catch (error) {
                console.error("Error fetching opportunities:", error);
            }
        };
        fetchOpportunities();
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchApps = async () => {
            const q = query(
                collection(db, "applications"),
                where("userId", "==", user.uid)
            );
            const snapshot = await getDocs(q);
            const ids = new Set(snapshot.docs.map(doc => doc.data().opportunityId));
            setFetchedAppliedIds(ids);
        };

        fetchApps();
    }, [user]);

    const handleApply = async (opportunity) => {
        if (!user) {
            alert("Please log in first");
            return;
        }

        // Check both pre-existing and in-session applications
        if (fetchedAppliedIds.has(opportunity.id) || sessionApplied.has(opportunity.id)) {
            alert("You already applied for this opportunity");
            return;
        }

        try {
            const stages = ["Submitted", "Received", "Under Evaluation", "Final Decision"];
            const newStatus = "Submitted";
            const stageIndex = stages.indexOf(newStatus);

            const applicationData = {
                userId: user.uid,
                opportunityId: opportunity.id,
                title: opportunity.title || "",
                company: opportunity.company || opportunity.companyName || "",
                status: newStatus,
                stageIndex: stageIndex,
                appliedAt: Timestamp.now()
            };

            const docRef = await addDoc(collection(db, "applications"), applicationData);

            await addDoc(collection(db, "notifications"), {
                userId: user.uid,
                title: "Application submitted",
                body: `Your application for ${opportunity.title} has been received.`,
                read: false,
                type: "status_update",
                createdAt: Timestamp.now(),
            });

            // FIX: track in sessionApplied (not fetchedAppliedIds) so the card
            // stays visible — enabling the duplicate-click test to reach handleApply
            // a second time and receive the "already applied" alert.
            setSessionApplied(prev => new Set([...prev, opportunity.id]));

            const newApp = { id: docRef.id, ...applicationData };
            if (props.onApplicationAdded) {
                props.onApplicationAdded(newApp);
            }

            alert("Application submitted!");
        } catch (error) {
            console.error("Error applying:", error);
            alert("Failed to submit application. Please try again.");
        }
    };

    // Only filter out opportunities that were already applied for before
    // this session. In-session applied opps remain visible (button disabled).
    const visibleOpportunities = opportunities.filter(
        opp => !fetchedAppliedIds.has(opp.id)
    );

    return (
        <section className="opportunities-page">
            <header className="opportunities-header">
                <p className="eyebrow">Opportunities</p>
                <h1 className="opportunities-title">Available Opportunities</h1>
                <p className="opportunities-subtitle">
                    Find and apply for learnerships, internships and apprenticeships
                </p>
            </header>

            <section className="opportunities-grid">
                {opportunities.length === 0 && (
                    <p>No opportunities available at the moment.</p>
                )}
                {visibleOpportunities.map((opportunity) => (
                    <article key={opportunity.id} className="opportunity-card">
                        <h3>{opportunity.title}</h3>
                        <p>{opportunity.description}</p>
                        <p>📍 {opportunity.location}</p>
                        <p>💰 {opportunity.stipend}</p>
                        <p>📅 Closes: {opportunity.closingDate}</p>

                        {opportunity.company || opportunity.companyName ? (
                            <p>🏢 {opportunity.company || opportunity.companyName}</p>
                        ) : null}

                        {opportunity.companyUrl && (
                            <a
                                href={opportunity.companyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="more-info-btn"
                            >
                                More about {opportunity.company || "this provider"}
                            </a>
                        )}

                        <button
                            className="apply-btn"
                            onClick={() => handleApply(opportunity)}
                        >
                            Apply Now
                        </button>
                    </article>
                ))}
            </section>
        </section>
    );
}

export default OpportunityList;
