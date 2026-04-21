import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignupPage from '../pages/signupPage';
import LoginPage from '../pages/loginPage';
import ApplicantDashboard from '../components/applicantDashboard/Dashboard';
import AdminLayout from '../pages/adminLayout';
import AdminDashboard from '../pages/adminDashboard';
import ProviderDashboard from '../pages/ProviderDashboard';
import ApplicantProfile from '../components/applicantDashboard/ApplicantProfile';
import CreateProfile from "../components/applicantDashboard/CreateProfile";



export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup"                element={<SignupPage />} />
        <Route path="/login"                 element={<LoginPage />} />
        <Route path="/dashboard/applicant" element={<ApplicantDashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/provider" element={<ProviderDashboard />} />
        <Route path="/dashboard/myProfile" element={<ApplicantProfile />} />
        <Route path="/dashboard/createProfile" element={<CreateProfile />} />
        
        


        

        <Route path="/"                      element={<Navigate to="/signup" replace />} />
        <Route path="*"                      element={<Navigate to="/signup" replace />} />
      </Routes>
    </BrowserRouter>
  );
}