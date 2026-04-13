import "./Dashboard.css";
import MyApplications from "./MyApplications";
import OpportunityList from "./OpportunityList";

function Dashboard() {
<<<<<<< HEAD
    return (
        <main className="dashboard-page">
            <MyApplications name="Peace" />
            <OpportunityList />
        </main>
    );
=======
    return(
    <div className="dashboard">
    <h1 className="dashboard-title">Applicant Dashboard</h1>
    <MyApplications name="Peace"/>
    <OpportunityList />
    </div>);
>>>>>>> e0267178e6edfb48b3da1c31d2d064503820b2ab
}

export default Dashboard;