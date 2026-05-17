import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
<<<<<<< HEAD
import { signUpWithEmail, signUpWithGoogle } from '../services/authService';
=======
import { signUpWithGoogle } from '../services/authService';
>>>>>>> dev-auth-fix

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
<<<<<<< HEAD
    email: "",
    password: "",
=======
>>>>>>> dev-auth-fix
    province: "",
    qualification: "",
  });

  const [loading, setLoading] = useState(false);
<<<<<<< HEAD
=======
  const [errorMsg, setErrorMsg] = useState("");

>>>>>>> dev-auth-fix
  const navigate = useNavigate();

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

<<<<<<< HEAD
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const cleanEmail = form.email.trim().toLowerCase();

      const user = await signUpWithEmail(
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

      console.log("User created:", user);

      navigate("/dashboard/createProfile");
    } catch (error) {
      console.error("Signup failed:", error);
      alert("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);

    try {
      const user = await signUpWithGoogle();

      console.log("User created with Google:", user);

      navigate("/dashboard/createProfile");
    } catch (error) {
      console.error("Google signup failed:", error);
      alert("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }

  };
  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset>
        <legend>Personal details</legend>

        <p className="field-row">
          <label>
            First name
            <input
              type="text"
              value={form.firstName}
              onChange={set("firstName")}
              required
            />
          </label>

          <label>
            Last name
            <input
              type="text"
              value={form.lastName}
              onChange={set("lastName")}
              required
            />
          </label>
        </p>

        <label>
          Email address
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            required
          />
=======
  const handleGoogleSignup = async () => {
    if (loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      if (
        !form.firstName ||
        !form.lastName ||
        !form.province ||
        !form.qualification
      ) {
        setErrorMsg("Please fill in all required fields.");
        return;
      }

      const user = await signUpWithGoogle("applicant", {
        firstName: form.firstName,
        lastName: form.lastName,
        fullName: form.firstName + " " + form.lastName,
        province: form.province,
        qualification: form.qualification,
      });

      console.log("Applicant created:", user.uid);

      navigate("/dashboard/applicant");

    } catch (error) {
      console.error("Applicant signup failed:", error);
      setErrorMsg("Google signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form noValidate>
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
>>>>>>> dev-auth-fix
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
<<<<<<< HEAD
          Highest qualification
          <select
            value={form.qualification}
            onChange={set("qualification")}
            required
          >
=======
          Qualification
          <select value={form.qualification} onChange={set("qualification")} required>
>>>>>>> dev-auth-fix
            <option value="">Select NQF level</option>
            {NQF_LEVELS.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </fieldset>

<<<<<<< HEAD
      <button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </button>

      <button type="button" onClick={handleGoogleSignup} disabled={loading}>
        {loading ? "Signing in with Google..." : "Sign up with Google"}
=======
      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={loading}
      >
        {loading ? "Signing up..." : "Continue with Google"}
>>>>>>> dev-auth-fix
      </button>
    </form>
  );
}