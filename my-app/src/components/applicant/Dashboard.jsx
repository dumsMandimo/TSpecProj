import "./Dashboard.css";
import MyApplications from "./MyApplications";
import OpportunityList from "./OpportunityList";

function Dashboard() {
    return (
        <main className="dashboard-page">
            <MyApplications name="Peace" />
            <OpportunityList />
        </main>
    );
}

export default Dashboard;