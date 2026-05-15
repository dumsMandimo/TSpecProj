import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import SignupPage from "../pages/signupPage";
import LoginPage from "../pages/loginPage";

import AdminLayout from "../pages/admin/adminLayout";
import AdminDashboard from "../pages/admin/adminDashboard";
import Opportunities from "../pages/admin/Opportunities";
import Users from "../pages/admin/Users";
import NotificationDetail from "../components/applicantDashboard/NotificationDetail"; 

import ApplicantDashboard from "../components/applicantDashboard/Dashboard";
import ApplicantProfile from '../components/applicantDashboard/ApplicantProfile';
import CreateProfile from '../components/applicantDashboard/CreateProfile';

import ProviderDashboard from "../pages/ProviderDashboard/ProviderDashboard";

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ADMIN */}
        <Route path="/dashboard/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="users" element={<Users />} />
          
        </Route>

        <Route path="/dashboard/applicant" element={<ApplicantDashboard />} />
        <Route path="/dashboard/applicant/myProfile" element={<ApplicantProfile />} />
        <Route path="/dashboard/applicant/createProfile" element={<CreateProfile />} />
        <Route path="/dashboard/applicant/notifications/:notificationId" element={<NotificationDetail />} />

        <Route path="/dashboard/provider" element={<ProviderDashboard />} />

        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="*" element={<Navigate to="/signup" replace />} />
      </Routes>
    </HashRouter>
  ); 
}