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
import MyApplications from '../components/applicantDashboard/MyApplications';
import ApplicationDetail from '../components/applicantDashboard/ApplicationDetail';

import ProviderDashboard from "../pages/ProviderDashboard/ProviderDashboard";
import providerApproval from "../components/providerApproval";
import PendingApproval from "../components/providerApproval";

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
        <Route path="/dashboard/applicant/applications" element={<MyApplications />} />
        <Route path="/dashboard/applicant/applications/:applicationId" element={<ApplicationDetail />} />

        <Route path="/dashboard/provider" element={<ProviderDashboard />} />
        <Route path="/pending-approval" element={<PendingApproval/>} />

        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="*" element={<Navigate to="/signup" replace />} />
      </Routes>
    </HashRouter>
  ); 
}