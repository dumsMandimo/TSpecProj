import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

import SignupPage from '../pages/signupPage';
import LoginPage from '../pages/loginPage';

import ApplicantDashboard from '../components/applicantDashboard/Dashboard';
import ApplicantProfile from '../components/applicantDashboard/ApplicantProfile';
import CreateProfile from '../components/applicantDashboard/CreateProfile';

import ProviderDashboard from '../pages/ProviderDashboard';
import ProtectedRoute from '../components/ProtectedRoute';

import AdminLayout from '../pages/adminLayout';
import AdminDashboard from '../pages/adminDashboard';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public routes */}
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Applicant protected routes */}
          <Route
            path="/dashboard/applicant"
            element={
              <ProtectedRoute allowedRoles={["applicant"]}>
                <ApplicantDashboard />
              </ProtectedRoute>
            }
          />
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

          {/* Provider protected route */}
          <Route
            path="/dashboard/provider"
            element={
              <ProtectedRoute allowedRoles={["provider"]}>
                <ProviderDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin protected route */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/signup" replace />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/signup" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}