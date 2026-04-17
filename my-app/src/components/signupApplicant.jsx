import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { signUpWithEmail, signUpWithGoogle } from '../services/authService';

const NQF_LEVELS = [
  "NQF 1 — General Certificate",
  "NQF 2 — Elementary Certificate",
  "NQF 3 — Intermediate Certificate",
  "NQF 4 — National Certificate (Matric)",
  "NQF 5 — Higher Certificate",
  "NQF 6 — Diploma / Advanced Certificate",
  "NQF 7 — Bachelor’s Degree",
  "NQF 8 — Honours / Postgrad Diploma",
  "NQF 9 — Master’s Degree",
  "NQF 10 — Doctoral Degree",
];

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

export default function SignupApplicant() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    province: "",
    qualification: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;
    setLoading(true);
    setErrorMsg("");

    if (form.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const cleanEmail = form.email.trim().toLowerCase();

      await signUpWithEmail(
        cleanEmail,
        form.password,
        "applicant",
        {
          firstName: form.firstName,
          lastName: form.lastName,
          province: form.province,
          qualification: form.qualification,
        }
      );

      // ✅ FIX ADDED HERE
      localStorage.setItem("role", "applicant");

      navigate("/dashboard/applicant");

    } catch (error) {
      console.error("Signup failed:", error);

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
          setErrorMsg("Signup failed. Please try again.");
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
      await signUpWithGoogle();

      // (optional consistency fix, same logic applies)
      localStorage.setItem("role", "applicant");

      navigate("/dashboard/applicant");

    } catch (error) {
      console.error("Google signup failed:", error);
      setErrorMsg("Google sign-in failed. Please try again.");

    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset>
        <legend>Personal details</legend>

        {errorMsg && (
          <p style={{ color: "red", marginBottom: "10px" }}>
            {errorMsg}
          </p>
        )}

        <label>
          First name
          <input value={form.firstName} onChange={set("firstName")} required />
        </label>

        <label>
          Last name
          <input value={form.lastName} onChange={set("lastName")} required />
        </label>

        <label>
          Email
          <input type="email" value={form.email} onChange={set("email")} required />
        </label>

        <label>
          Password
          <input type="password" value={form.password} onChange={set("password")} required />
        </label>

        <label>
          Province
          <select value={form.province} onChange={set("province")} required>
            <option value="">Select province</option>
            {PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>

        <label>
          Qualification
          <select value={form.qualification} onChange={set("qualification")} required>
            <option value="">Select NQF level</option>
            {NQF_LEVELS.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </fieldset>

      <button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </button>

      <button type="button" onClick={handleGoogleSignup} disabled={loading}>
        {loading ? "Signing in..." : "Sign up with Google"}
      </button>
    </form>
  );
}