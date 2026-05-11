import "./Dashboard.css";
import MyApplications from "./MyApplications";
import OpportunityList from "./OpportunityList";
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
=======
>>>>>>> d8db91e1a2df0b0b6aaa46a41b4380a4801be230
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
<<<<<<< HEAD
import { auth } from "../../firebase";
>>>>>>> Stashed changes
=======
>>>>>>> d8db91e1a2df0b0b6aaa46a41b4380a4801be230

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
<<<<<<< HEAD
<<<<<<< Updated upstream
            <MyApplications name="Peace" />
            <OpportunityList />
=======
=======
>>>>>>> d8db91e1a2df0b0b6aaa46a41b4380a4801be230
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
<<<<<<< HEAD

            
>>>>>>> Stashed changes
=======
>>>>>>> d8db91e1a2df0b0b6aaa46a41b4380a4801be230
        </main>
    );

    
}

<<<<<<< HEAD
<<<<<<< Updated upstream
export default Dashboard;
=======
export default Dashboard;

>>>>>>> Stashed changes
=======
export default Dashboard;
>>>>>>> d8db91e1a2df0b0b6aaa46a41b4380a4801be230
