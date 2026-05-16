import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./loginPage.css";

import { signUpWithGoogle } from "../services/authService";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const { role } = await signUpWithGoogle();

      if (role === "admin") navigate("/dashboard/admin");
      else if (role === "provider") navigate("/provider-dashboard");
      else if (role === "applicant") navigate("/applicant-dashboard");
      else alert("Unknown role. Contact support.");

    } catch (error) {
      console.error("GOOGLE LOGIN ERROR:", error);
      alert(error.message || "Google login failed. Please try again.");
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