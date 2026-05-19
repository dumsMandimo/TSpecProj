import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./loginPage.css";

import { signInWithGoogle } from "../services/authService";
import { getUserRole } from "../services/userService";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      // 1. Authenticate user via Google
      const { user, exists } = await signInWithGoogle();
      console.log("Logged in user:", user.uid);

      // 2. Check if user exists in Firestore
      if (!exists) {
        alert("No account found. Please sign up first.");
        return;
      }

      // 3. Fetch role from Firestore
      const role = await getUserRole(user.uid);

      if (!role) {
        alert("No role assigned. Contact support.");
        return;
      }

      console.log("Navigating based on role:", role);

      // 4. Store role locally
      localStorage.setItem("role", role);

      // 5. Redirect based on role
      if (role === "admin") navigate("/dashboard/admin");
      else if (role === "provider") navigate("/dashboard/provider");
      else navigate("/dashboard/applicant");

    } catch (error) {
      console.error("GOOGLE LOGIN ERROR:", error);
      alert("Google login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <aside className="login-left">
        <header className="brand">
          <span className="brand-mark">UBUNTU</span>
          <span className="brand-name">CAREERS</span>
        </header>

        <section className="hero">
          <h1>Connect.<br />Learn.<br />Grow.</h1>
          <p>
            South Africa's platform linking work-seekers with SETA-accredited learnerships,
            apprenticeships and internships.
          </p>
        </section>

        <ul className="stats">
          <li><strong>12k+</strong><span>Opportunities</span></li>
          <li><strong>800+</strong><span>Providers</span></li>
          <li><strong>9</strong><span>Provinces</span></li>
        </ul>
      </aside>

      <section className="login-right">
        <h4>Sign in to your account</h4>
        <p className="subtitle">Welcome back!</p>

        <section className="form-panel">
          <button
            onClick={handleGoogleLogin}
            className="btn"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in with Google"}
          </button>
        </section>
      </section>
    </main>
  );
}