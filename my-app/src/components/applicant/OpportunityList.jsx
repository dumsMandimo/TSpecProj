import { useState } from "react";
import "./OpportunityList.css";

function OpportunityList() {
    const [appliedIds, setAppliedIds] = useState([]);

    const opportunities = [
        { id: 1, title: "Software Development Internship", description: "Work with our dev team building web applications", location: "Johannesburg", closingDate: "2026-05-01", stipend: "R5000/month" },
        { id: 2, title: "Data Science Learnership", description: "Learn data analysis and machine learning", location: "Cape Town", closingDate: "2026-05-15", stipend: "R4500/month" },
        { id: 3, title: "IT Support Apprenticeship", description: "Gain hands-on IT support experience", location: "Pretoria", closingDate: "2026-06-01", stipend: "R3500/month" },
    ];

    return (
        <section className="opportunities-page">
            <header className="opportunities-header">
                <p className="eyebrow">Opportunities</p>
                <h1 className="opportunities-title">Available Opportunities</h1>
                <p className="opportunities-subtitle">Find and apply for learnerships, internships and apprenticeships</p>
            </header>

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
        </section>
    );
}

export default OpportunityList;