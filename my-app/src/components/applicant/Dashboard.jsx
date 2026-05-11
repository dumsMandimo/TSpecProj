import "./Dashboard.css";
import MyApplications from "./MyApplications";
import OpportunityList from "./OpportunityList";

function Dashboard() {
    return (
        <main className="dashboard-page">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Applicant Dashboard</h1>
            </header>

            <section className="dashboard-content">
                <MyApplications name="Peace" />
                <OpportunityList />
            </section>
        </main>
    );
}

export default Dashboard;