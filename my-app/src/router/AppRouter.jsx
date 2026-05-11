import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
import { AuthProvider } from '../context/AuthContext';

>>>>>>> Stashed changes
=======

>>>>>>> d8db91e1a2df0b0b6aaa46a41b4380a4801be230
import SignupPage from '../pages/signupPage';
import LoginPage from '../pages/loginPage';

import ApplicantDashboard from '../components/applicantDashboard/Dashboard';
import ProviderDashboard from '../pages/ProviderDashboard';

<<<<<<< HEAD
<<<<<<< Updated upstream
=======
import ApplicantProfile from '../components/applicantDashboard/ApplicantProfile';
import CreateProfile from '../components/applicantDashboard/CreateProfile';
>>>>>>> Stashed changes
=======
import ApplicantProfile from '../components/applicantDashboard/ApplicantProfile';
import CreateProfile from "../components/applicantDashboard/CreateProfile";
>>>>>>> d8db91e1a2df0b0b6aaa46a41b4380a4801be230

import ProtectedRoute from '../components/ProtectedRoute';

export default function AppRouter() {
  return (
    <BrowserRouter>
<<<<<<< Updated upstream
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

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/signup" replace />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/signup" replace />} />

      </Routes>
=======
      <AuthProvider>  {/* ✅ Single auth listener wraps all routes */}
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

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/signup" replace />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/signup" replace />} />

        </Routes>
      </AuthProvider>
>>>>>>> Stashed changes
    </BrowserRouter>
  );
}