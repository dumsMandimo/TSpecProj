import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpWithEmail, signUpWithGoogle } from '../services/authService';

export default function SignupAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setErrorMsg("");

    if (form.password !== form.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = form.email.trim().toLowerCase();

      await signUpWithEmail(
        cleanEmail,
        form.password,
        "admin",
        {
          fullName: form.fullName,
        }
      );

      console.log("Admin created successfully");

      // ✅ FIX ADDED HERE
      localStorage.setItem("role", "admin");

      navigate("/dashboard/admin");

    } catch (error) {
      console.error("Admin signup failed:", error);

      switch (error.code) {
        case "auth/email-already-in-use":
          setErrorMsg("This account already exists. Please log in instead.");
          break;

        case "auth/invalid-email":
          setErrorMsg("Please enter a valid email address.");
          break;

        case "auth/weak-password":
          setErrorMsg("Password is too weak.");
          break;

        default:
          setErrorMsg("Admin signup failed. Please try again.");
          break;
      }

    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      await signUpWithGoogle("admin");

      console.log("Admin Google signup successful");

      // optional consistency fix
      localStorage.setItem("role", "admin");

      navigate("/dashboard/admin");

    } catch (error) {
      console.error("Google signup failed:", error);
      setErrorMsg("Google signup failed. Please try again.");

    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Admin details</legend>

        {errorMsg && (
          <p style={{ color: "red", marginBottom: "10px" }}>
            {errorMsg}
          </p>
        )}

        <label>
          Full name
          <input
            type="text"
            value={form.fullName}
            onChange={set('fullName')}
            required
          />
        </label>

        <label>
          Email address
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            required
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            required
          />
        </label>
      </fieldset>

      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create admin account"}
      </button>

      <button type="button" onClick={handleGoogleSignup} disabled={loading}>
        {loading ? "Signing in..." : "Sign up with Google"}
      </button>
    </form>
  );
}