import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./loginPage.css";

import { signUpWithGoogle } from "../services/authService";
import { db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      // Step 1: Sign in with Google
      const { user } = await signUpWithGoogle(); // don't pass role, we just want login

      if (!user) throw new Error("Google authentication failed.");

      // Step 2: Fetch role from Firestore
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        throw new Error("No account found. Please sign up first.");
      }

      const role = snap.data().role;
      console.log("Fetched role from Firestore:", role);

      if (!role) throw new Error("User role not found.");

      const normalizedRole = role.toLowerCase();

      // Step 3: Navigate based on role
      if (normalizedRole === "admin") navigate("/dashboard/admin");
      else if (normalizedRole === "provider") navigate("/dashboard/provider");
      else if (normalizedRole === "applicant") navigate("/dashboard/applicant");
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