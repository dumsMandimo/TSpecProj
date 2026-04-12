import MyApplications from "./MyApplications";
import OpportunityList from "./OpportunityList";
import "./Dashboard.css";

function Dashboard() {
    return(<>
    <h1 className="dashboard-title">Applicant Dashboard</h1>
    <MyApplications name="Peace"/>
    <OpportunityList />
    </>);
}

export default Dashboard