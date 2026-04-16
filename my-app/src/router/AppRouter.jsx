import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignupPage from '../pages/signupPage';
import LoginPage from '../pages/loginPage';
import ApplicantDashboard from '../components/applicantDashboard/Dashboard';
import AdminLayout from '../pages/adminLayout';
import AdminDashboard from '../pages/admin/adminDashboard';
import ProviderDashboard from '../pages/ProviderDashboard';



export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup"                element={<SignupPage />} />
        <Route path="/login"                 element={<LoginPage />} />
        <Route path="/dashboard/applicant" element={<ApplicantDashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/provider" element={<ProviderDashboard />} />

        

        <Route path="/"                      element={<Navigate to="/signup" replace />} />
        <Route path="*"                      element={<Navigate to="/signup" replace />} />
      </Routes>
    </BrowserRouter>
  );
}