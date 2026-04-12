import { useState } from "react";

import SignupPage from "./pages/signupPage";
import ProviderDashboard from "./pages/ProviderDashboard";
// import ApplicantDashboard from "./pages/ApplicantDashboard";
// import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const [user, setUser] = useState(null);

  const handleSignupComplete = (role) => {
    setUser({ role });
  };

  // ROUTING BASED ON ROLE
  if (user?.role === "provider") {
    return <ProviderDashboard />;
  }

  if (user?.role === "applicant") {
    return <main>Applicant Dashboard (coming soon)</main>;
  }

  if (user?.role === "admin") {
    return <main>Admin Dashboard (coming soon)</main>;
  }

  // DEFAULT → SIGNUP
  return (
    <main>
      <SignupPage onSignupComplete={handleSignupComplete} />
    </main>
  );
}