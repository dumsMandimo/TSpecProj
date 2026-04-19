import "./Dashboard.css";
import MyApplications from "./MyApplications";
import OpportunityList from "./OpportunityList";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

function Dashboard() {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);

    useEffect(() => {
        const fetchApplications = async () => {
            const querySnapshot = await getDocs(collection(db, "applications"));
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setApplications(data);
        };

        fetchApplications();
    }, []);

    return (
        <main className="dashboard-page">
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
        </main>
    );
}

export default Dashboard;
