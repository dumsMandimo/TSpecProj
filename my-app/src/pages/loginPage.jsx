import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './loginPage.css';

import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import { getUserRole } from "../services/userService";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email first");
      return;
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      await sendPasswordResetEmail(auth, cleanEmail);
      alert("Password reset email sent. Check your inbox.");
    } catch (error) {
      console.error(error);
      alert("Failed to send reset email: " + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      alert('Please enter email and password');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = userCredential.user;

      console.log("Logged in user:", user.uid);

      let role = null;

      try {
       role = await getUserRole(user.uid);
        console.log("Role fetched:", role);

        localStorage.setItem("role", role); // ADD THIS LINE
      } catch (err) {
        console.error("Role fetch error:", err);
        alert("Could not fetch user role");
        return;
      }

      if (!role) {
        alert("No role found for this user.");
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
      console.error("LOGIN ERROR:", error);

      if (error.code === "auth/invalid-credential") {
        alert("Invalid email or password.");
      } else {
        alert("Login failed: " + error.message);
      }

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
          <form onSubmit={handleSubmit}>

            <input
              type="email"
              placeholder="Email"
              className="text_input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="text_input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <input
              type="submit"
              value={loading ? "Logging in..." : "LOGIN"}
              className="btn"
              disabled={loading}
            />

          </form>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="forgot-btn"
          >
            Forgot password?
          </button>

        </section>

        <p className="login-prompt">
          Don't have an account? <a href="/">Sign Up</a>
        </p>
      </section>

    </main>
  );
}