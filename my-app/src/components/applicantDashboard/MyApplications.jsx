import React from "react";
import "./MyApplications.css";

function MyApplications(props) {
    const applications = [
        { id: 1, title: "Software Internship", company: "TechCorp", status: "Received" },
        { id: 2, title: "Data Learnership", company: "DataSA", status: "Shortlisted" },
        { id: 3, title: "IT Apprenticeship", company: "NetWork", status: "Rejected" },
    ];

    return (
        <section className="applications-page">
            <header className="applications-header">
                <p className="eyebrow">Career Dashboard</p>
                <h1 className="applications-title">My Applications</h1>
                <h2 className="applications-subtitle">Welcome back, {props.name}</h2>
            </header>

            <div className="applications-grid">
                {applications.map((application) => (
                    <article key={application.id} className="application-card">
                        <h3>{application.title}</h3>
                        <p>{application.company}</p>
                        <span className={`status-pill status-${application.status.toLowerCase()}`}>
                            {application.status}
                        </span>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default MyApplications;