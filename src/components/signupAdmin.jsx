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
    } finally {
      setLoading(false);
    }
  };

  return (
    <form>
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

      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={loading}
      >
        {loading ? "Signing in..." : "Continue with Google"}
      </button>
    </form>
  );
}