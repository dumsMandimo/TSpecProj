import { Fragment } from "react";
import "./OpportunityList.css";

function OpportunityList() {
    const opportunities = [
        { id: 1, title: "Software Development Internship", description: "Work with our dev team building web applications", location: "Johannesburg", closingDate: "2026-05-01", stipend: "R5000/month" },
        { id: 2, title: "Data Science Learnership", description: "Learn data analysis and machine learning", location: "Cape Town", closingDate: "2026-05-15", stipend: "R4500/month" },
        { id: 3, title: "IT Support Apprenticeship", description: "Gain hands-on IT support experience", location: "Pretoria", closingDate: "2026-06-01", stipend: "R3500/month" },
    ];

    return (
        <>
            <h1 className="opportunities-title">Available Opportunities</h1>
            {opportunities.map((opportunity) => (
                <Fragment key={opportunity.id}>
                    <h3>{opportunity.title}</h3>
                    <p>{opportunity.description}</p>
                    <p>Location: {opportunity.location}</p>
                    <p>Stipend: {opportunity.stipend}</p>
                    <p>Closing Date: {opportunity.closingDate}</p>
                    <button className="apply-btn">Apply</button>
                </Fragment>
            ))}
        </>
    );
}

export default OpportunityList;