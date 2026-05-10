import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import SignupPage from '../pages/signupPage';
import LoginPage from '../pages/loginPage';

import ApplicantDashboard from '../components/applicantDashboard/Dashboard';
import AdminDashboard from '../pages/adminDashboard';
import ProviderDashboard from '../pages/ProviderDashboard';

import ApplicantProfile from '../components/applicantDashboard/ApplicantProfile';
import CreateProfile from "../components/applicantDashboard/CreateProfile";

import ProtectedRoute from '../components/ProtectedRoute';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected dashboards */}
        <Route
          path="/dashboard/applicant"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/provider"
          element={
            <ProtectedRoute allowedRoles={["provider"]}>
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected applicant-only pages */}
        <Route
          path="/dashboard/myProfile"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/createProfile"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <CreateProfile />
            </ProtectedRoute>
          }
        />

        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="*" element={<Navigate to="/signup" replace />} />

      </Routes>
    </BrowserRouter>
  );
}