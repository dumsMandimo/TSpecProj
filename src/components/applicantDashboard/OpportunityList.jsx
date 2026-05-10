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
    const [applications, setApplications] = useState([]);

    
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
                const querySnapshot = await getDocs(
                    collection(db, "applicantOpportunities")
                );

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
            const stages = [
                "Submitted",
                "Received",
                "Under Evaluation",
                "Final Decision"
            ];

            const newStatus = "Submitted";
            const stageIndex = stages.indexOf(newStatus);

            const docRef = await addDoc(collection(db, "applications"), {
                userId: user.uid, 
                opportunityId: opportunity.id,
                title: opportunity.title,
                company: opportunity.company,
                status: newStatus,
                stageIndex: stageIndex,
                appliedAt: Timestamp.now()
            });

            const newApp = {
                id: docRef.id,
                userId: user.uid,
                opportunityId: opportunity.id,
                title: opportunity.title,
                company: opportunity.company,
                status: newStatus,
                stageIndex: stageIndex
            };

            setApplications(prev => [...prev, newApp]);

            if (props.onApplicationAdded) {
                props.onApplicationAdded(newApp);
            }

            alert("Application submitted!");
        } catch (error) {
            console.error("Error applying:", error);
        }
    };

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
                {opportunities
                    .filter(opportunity =>
                        !applications.some(
                            app => app.opportunityId === opportunity.id
                        )
                    )
                    .map((opportunity) => (
                        <article key={opportunity.id} className="opportunity-card">
                            <h3>{opportunity.title}</h3>
                            <p>{opportunity.description}</p>
                            <p>📍 {opportunity.location}</p>
                            <p>💰 {opportunity.stipend}</p>
                            <p>📅 Closes: {opportunity.closingDate}</p>

                            {/* More Info Button */}
                            {opportunity.companyUrl && (
                            <a
                            href={opportunity.companyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="more-info-btn"
                            >
                            More about {opportunity.company}
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
