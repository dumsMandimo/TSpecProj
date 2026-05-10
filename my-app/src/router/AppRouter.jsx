import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
<<<<<<< Updated upstream
=======
import { AuthProvider } from '../context/AuthContext';

>>>>>>> Stashed changes
import SignupPage from '../pages/signupPage';
import LoginPage from '../pages/loginPage';
import ApplicantDashboard from '../components/applicantDashboard/Dashboard';
import AdminLayout from '../pages/adminLayout';
import AdminDashboard from '../pages/adminDashboard';
import ProviderDashboard from '../pages/ProviderDashboard';

<<<<<<< Updated upstream
=======
import ApplicantProfile from '../components/applicantDashboard/ApplicantProfile';
import CreateProfile from '../components/applicantDashboard/CreateProfile';
>>>>>>> Stashed changes


export default function AppRouter() {
  return (
    <BrowserRouter>
<<<<<<< Updated upstream
      <Routes>
        <Route path="/signup"                element={<SignupPage />} />
        <Route path="/login"                 element={<LoginPage />} />
        <Route path="/dashboard/applicant" element={<ApplicantDashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/provider" element={<ProviderDashboard />} />

        

        <Route path="/"                      element={<Navigate to="/signup" replace />} />
        <Route path="*"                      element={<Navigate to="/signup" replace />} />
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