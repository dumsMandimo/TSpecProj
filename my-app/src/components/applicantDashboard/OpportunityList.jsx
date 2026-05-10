<<<<<<< Updated upstream
import { useState } from "react";
=======
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
>>>>>>> Stashed changes
import "./OpportunityList.css";

function OpportunityList() {
    const [appliedIds, setAppliedIds] = useState([]);

<<<<<<< Updated upstream
    const opportunities = [
        { id: 1, title: "Software Development Internship", description: "Work with our dev team building web applications", location: "Johannesburg", closingDate: "2026-05-01", stipend: "R5000/month" },
        { id: 2, title: "Data Science Learnership", description: "Learn data analysis and machine learning", location: "Cape Town", closingDate: "2026-05-15", stipend: "R4500/month" },
        { id: 3, title: "IT Support Apprenticeship", description: "Gain hands-on IT support experience", location: "Pretoria", closingDate: "2026-06-01", stipend: "R3500/month" },
    ];
=======
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        setApplications([]);
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
            const apps = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setApplications(apps);
        };

        fetchApps();
    }, [user]);

    const handleApply = async (opportunity) => {
        if (!user) {
            alert("Please log in first");
            return;
        }

        const alreadyApplied = applications.some(
            app => app.opportunityId === opportunity.id
        );

        if (alreadyApplied) {
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
            const newApp = { id: docRef.id, ...applicationData };

            setApplications(prev => [...prev, newApp]);

            if (props.onApplicationAdded) {
                props.onApplicationAdded(newApp);
            }

            alert("Application submitted!");
        } catch (error) {
            console.error("Error applying:", error);
            alert("Failed to submit application. Please try again.");
        }
    };
>>>>>>> Stashed changes

    return (
        <section className="opportunities-page">
            <header className="opportunities-header">
                <p className="eyebrow">Opportunities</p>
                <h1 className="opportunities-title">Available Opportunities</h1>
                <p className="opportunities-subtitle">Find and apply for learnerships, internships and apprenticeships</p>
            </header>

<<<<<<< Updated upstream
            <div className="opportunities-grid">
                {opportunities.map((opportunity) => (
                    <article key={opportunity.id} className="opportunity-card">
                        <h3>{opportunity.title}</h3>
                        <p>{opportunity.description}</p>
                        <p>📍 {opportunity.location}</p>
                        <p>💰 {opportunity.stipend}</p>
                        <p>📅 Closes: {opportunity.closingDate}</p>
                        <button
                            className="apply-btn"
                            onClick={() => setAppliedIds([...appliedIds, opportunity.id])}
                            disabled={appliedIds.includes(opportunity.id)}
                        >
                            {appliedIds.includes(opportunity.id) ? "Already Applied" : "Apply Now"}
                        </button>
                    </article>
                ))}
            </div>
=======
            <section className="opportunities-grid">
                {opportunities.length === 0 && (
                    <p>No opportunities available at the moment.</p>
                )}
                {opportunities
                    .filter(opportunity =>
                        !applications.some(app => app.opportunityId === opportunity.id)
                    )
                    .map((opportunity) => (
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
>>>>>>> Stashed changes
        </section>
    );
}

export default OpportunityList;