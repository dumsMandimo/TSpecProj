import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./loginPage.css";

import { signUpWithGoogle } from "../services/authService";
import { getUserRole } from "../services/userService";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const user = await signUpWithGoogle();

      console.log("Logged in user:", user.uid);

      let role = null;

      try {
        role = await getUserRole(user.uid);
        console.log("Role fetched:", role);

        if (role) {
          localStorage.setItem("role", role);
        }
      } catch (err) {
        console.error("Role fetch error:", err);

        alert("We couldn't verify your account. Please sign up first.");
        navigate("/signup");
        return;
      }

      if (!role) {
        console.warn("No role found for user:", user.uid);

        alert("We couldn't find your account. Please sign up first.");
        navigate("/signup");
        return;
      }

      console.log("Navigating based on role:", role);

      if (role === "admin") {
        navigate("/dashboard/admin");
      } else if (role === "provider") {
        navigate("/dashboard/provider");
      } else {
        navigate("/dashboard/applicant");
      }

    } catch (error) {
      console.error("GOOGLE LOGIN ERROR:", error);

      // Always show friendly message regardless of exact backend wording
      alert("We couldn't complete login. Please make sure you have an account or sign up first.");

      navigate("/signup");
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