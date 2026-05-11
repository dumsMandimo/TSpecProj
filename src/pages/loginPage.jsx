<<<<<<< HEAD
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './loginPage.css';

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { getUserRole } from "../services/userService";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    console.log('Login attempt:', { cleanEmail, password });

    if (!cleanEmail || !password) {
      alert('Please enter email and password');
      return;
    }

    setLoading(true);

    try {
      // 1. Firebase login
      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = userCredential.user;

      // 2. Get role from Firestore
      const role = await getUserRole(user.uid);

      console.log("Logged in role:", role);

      // 3. Safety check
      if (!role) {
        alert("No role found for this user. Contact admin.");
        setLoading(false);
        return;
      }

      // 4. Role-based routing
      if (role === "admin") {
        navigate("/dashboard/admin");
      } 
      else if (role === "provider") {
        navigate("/dashboard/provider");
      } 
      else {
=======
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
      // 1. Authenticate user (Google login)
      const user = await signUpWithGoogle();

      console.log("Logged in user:", user.uid);

      // 2. Fetch role from Firestore
      const role = await getUserRole(user.uid);

      // 3. If no role → user never signed up properly
      if (!role) {
        alert("No account found. Please sign up first.");
        return;
      }

      console.log("Navigating based on role:", role);

      // 4. Store role locally
      localStorage.setItem("role", role);

      // 5. Redirect user
      if (role === "admin") {
        navigate("/dashboard/admin");
      } else if (role === "provider") {
        navigate("/dashboard/provider");
      } else {
>>>>>>> dev-auth-fix
        navigate("/dashboard/applicant");
      }

    } catch (error) {
<<<<<<< HEAD
      console.error(error);

      if (error.code === "auth/invalid-credential") {
        alert("Invalid email or password.");
      } else {
        alert("Login failed: " + error.message);
=======
      console.error("GOOGLE LOGIN ERROR:", error);

      if (error.message === "Role is required for new users") {
        alert("No account found. Please sign up first.");
      } else {
        alert("Google login failed: " + error.message);
>>>>>>> dev-auth-fix
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
<<<<<<< HEAD
          <p>South Africa's platform linking work-seekers with SETA-accredited learnerships, apprenticeships and internships.</p>
=======
          <p>
            South Africa's platform linking work-seekers with SETA-accredited learnerships,
            apprenticeships and internships.
          </p>
>>>>>>> dev-auth-fix
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

<<<<<<< HEAD
        <section role="tabpanel" className="form-panel">
          <form onSubmit={handleSubmit}>
            <label className="text_area">
              <input
                type="email"
                placeholder="Email"
                className="text_input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="text_area">
              <input
                type="password"
                placeholder="Password"
                className="text_input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <input
              type="submit"
              value={loading ? "Logging in..." : "LOGIN"}
              className="btn"
              disabled={loading}
            />
          </form>
        </section>

        <p className="login-prompt">
          Don't have an account? <a href="/">Sign Up</a>
        </p>
=======
        <section className="form-panel">

          <button
            onClick={handleGoogleLogin}
            className="btn"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in with Google"}
          </button>

        </section>

>>>>>>> dev-auth-fix
      </section>

    </main>
  );
}