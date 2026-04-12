import MyApplications from "./components/applicant/MyApplications";
import SignupPage from "./pages/signupPage";

function App() {
   
    return (
        <> 
        <SignupPage />
            <h1> Applicant Dashboard</h1>
            <MyApplications name="Peace" />
        
       <MyApplications />

        </>
     
    );
}

export default App;