import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import SignupPage from "../pages/signupPage";
import LoginPage from "../pages/loginPage";

import AdminLayout from "../pages/admin/adminLayout";
import AdminDashboard from "../pages/admin/adminDashboard";
import Opportunities from "../pages/admin/Opportunities";
import Users from "../pages/admin/Users"; 

import ApplicantDashboard from "../components/applicantDashboard/Dashboard";
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
        <Route path="/dashboard/provider" element={<ProviderDashboard />} />
        <Route path="/pending-approval" element={<PendingApproval/>} />

        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="*" element={<Navigate to="/signup" replace />} />
      </Routes>
    </HashRouter>
  ); 
}