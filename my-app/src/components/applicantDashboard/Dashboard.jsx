import "./Dashboard.css";
import MyApplications from "./MyApplications";
import OpportunityList from "./OpportunityList";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { auth } from "../../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

function Dashboard() {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkApplicant() {
            // 1. Check if logged in
            if (!auth.currentUser) {
                navigate("/login");
                return;
            }

            // 2. Check if applicant
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists() || userSnap.data().role !== "applicant") {
                navigate("/login");
                return;
            }

            // 3. Role check passed — fetch applications
            const querySnapshot = await getDocs(collection(db, "applications"));
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setApplications(data);
            setLoading(false);
        }

        checkApplicant();
    }, [navigate]);

    if (loading) return <main className="dashboard-page"><p>Loading...</p></main>;

    return (
        <main className="dashboard-page">
            <MyApplications name="Peace" applications={applications} />
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