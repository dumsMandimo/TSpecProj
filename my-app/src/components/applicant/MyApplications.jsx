import React, { Fragment } from "react";
import "./MyApplications.css";

function MyApplications(props) {
    const applications = [
        { id: 1, title: "Software Internship", company: "TechCorp", status: "Received" },
        { id: 2, title: "Data Learnership", company: "DataSA", status: "Shortlisted" },
        { id: 3, title: "IT Apprenticeship", company: "NetWork", status: "Rejected" },
    ];

    return (
        <>
            <h1 className="applications-title">My Applications</h1>
            <h2>Welcome, {props.name}</h2>

            {applications.map((application) => (
                <Fragment key={application.id}>
                    <h3>{application.title}</h3>
                    <p>{application.company}</p>
                    <p>{application.status}</p>
                </Fragment>
            ))}
        </>
    );
}

export default MyApplications;