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
    console.log('Step 1: attempting Firebase auth...');

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );
      console.log('Step 2: Firebase auth success', userCredential);

      const user = userCredential.user;
      console.log('Step 3: getting role for uid', user.uid);

      const role = await getUserRole(user.uid);
      console.log('Step 4: role is', role);

      if (!role) {
        alert("No role found for this user. Contact admin.");
        setLoading(false);
        return;
      }

      if (role === "admin") {
        navigate("/dashboard/admin");
      } else if (role === "provider") {
        navigate("/dashboard/provider");
      } else {
        navigate("/dashboard/applicant");
      }

    } catch (error) {
      console.error('Step ERROR:', error.code, error.message);
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
          <p>South Africa's platform linking work-seekers with SETA-accredited learnerships, apprenticeships and internships.</p>
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
      </section>

    </main>
  );
}