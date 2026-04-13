import MyApplications from "./components/applicantDashboard/MyApplications";
import SignupPage from "./pages/signupPage";
import LoginPage from "./pages/loginPage";
import {BrowserRouter, Route, Routes} from "react-router-dom";

function App() {
  return (
   <BrowserRouter>

    <Routes>

      <Route path="/" element={<SignupPage />} />
      <Route path="/loginPage" element={<LoginPage />} />
      <Route path="/MyApplications" element={<MyApplications />} />

    </Routes>
      
    </BrowserRouter>
  );
}

export default App;