import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { signUpWithEmail, signUpWithGoogle } from '../services/authService';
=======
import { signUpWithGoogle } from '../services/authService';
>>>>>>> dev-auth-fix

export default function SignupAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
=======
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    fullName: '',
>>>>>>> dev-auth-fix
  });

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

<<<<<<< HEAD
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match');
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

      navigate("/dashboard/admin");

    } catch (error) {
      console.error(error);
      alert("Admin signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);

    try {
      await signUpWithGoogle("admin");
      navigate("/dashboard/admin");
    } catch (error) {
      console.error(error);
      alert("Google signup failed");
=======
  const handleGoogleSignup = async () => {
    if (loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      if (!form.fullName) {
        setErrorMsg("Please enter your full name.");
        setLoading(false);
        return;
      }

      const user = await signUpWithGoogle("admin", {
        fullName: form.fullName,
      });

      console.log("Admin created:", user.uid);

      localStorage.setItem("role", "admin");

      navigate("/dashboard/admin");

    } catch (error) {
      console.error("Admin signup failed:", error);
      setErrorMsg("Google signup failed. Please try again.");
>>>>>>> dev-auth-fix
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Admin details</legend>

=======
    <form>
      <fieldset>
        <legend>Admin details</legend>

        {errorMsg && (
          <p style={{ color: "red", marginBottom: "10px" }}>
            {errorMsg}
          </p>
        )}

>>>>>>> dev-auth-fix
        <label>
          Full name
          <input
            type="text"
            value={form.fullName}
            onChange={set('fullName')}
            required
          />
        </label>
<<<<<<< HEAD

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
        {loading ? "Signing in with Google..." : "Sign up with Google"}
=======
      </fieldset>

      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={loading}
      >
        {loading ? "Signing in..." : "Continue with Google"}
>>>>>>> dev-auth-fix
      </button>
    </form>
  );
}