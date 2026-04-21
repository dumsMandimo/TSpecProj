import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpWithGoogle } from '../services/authService';

export default function SignupAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    fullName: '',
  });

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleGoogleSignup = async (e) => {
    e.preventDefault();

    setErrorMsg("");

    // VALIDATION (IMPORTANT FIX)
    if (!form.fullName.trim()) {
      setErrorMsg("Please enter your full name before continuing.");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const user = await signUpWithGoogle("admin", {
        fullName: form.fullName,
      });

      console.log("Admin created:", user.uid);

      navigate("/dashboard/admin");

    } catch (error) {
      console.error(error);
      setErrorMsg("Google signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleGoogleSignup}>

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

      </fieldset>

      <button type="submit" disabled={loading}>
        {loading ? "Signing up..." : "Continue with Google"}
      </button>

    </form>
  );
}