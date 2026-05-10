import "./Dashboard.css";
import MyApplications from "./MyApplications";
import OpportunityList from "./OpportunityList";
<<<<<<< Updated upstream
=======
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { auth } from "../../firebase";
>>>>>>> Stashed changes

function Dashboard() {
    return (
        <main className="dashboard-page">
<<<<<<< Updated upstream
            <MyApplications name="Peace" />
            <OpportunityList />
=======
            {/* Pass applications to MyApplications */}
            <MyApplications name="Peace" applications={applications} />

            {/* Pass applications to OpportunityList */}
            <OpportunityList applications={applications} />

            <button 
              className="profile-button" 
              onClick={() => navigate("/dashboard/myProfile")}
            >
              My Profile
            </button>

            
>>>>>>> Stashed changes
        </main>
    );

    
}

<<<<<<< Updated upstream
export default Dashboard;
=======
export default Dashboard;

>>>>>>> Stashed changes
