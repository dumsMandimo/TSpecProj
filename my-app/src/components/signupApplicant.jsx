<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { NqfDropdown } from "../components/nqfSelect.jsx";
//import { signUpWithEmail, signUpWithGoogle } from "../services/authService";
=======
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { signUpWithGoogle } from '../services/authService';

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
>>>>>>> b086a4c7512174d6ae59bae88c2719c9bcfecb2d

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
<<<<<<< HEAD
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    province: "",
    qualification: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
<<<<<<< Updated upstream
    navigate('/dashboard/applicant');
=======
=======

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
        },
      );

      console.log("User created:", user);

      navigate("/dashboard/createProfile");
    } catch (error) {
      console.error("Signup failed:", error);
      alert("Signup failed. Please try again.");
=======
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    province: "",
    qualification: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleGoogleSignup = async (e) => {
    e.preventDefault();
>>>>>>> d8db91e1a2df0b0b6aaa46a41b4380a4801be230
    setErrorMsg("");

    // Prevent double submit early
    if (loading) return;
    setLoading(true);

    // Validation
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.province ||
      !form.qualification
    ) {
      setErrorMsg("Please fill in all required fields before continuing.");
      setLoading(false);
      return;
    }

    try {
      const user = await signUpWithGoogle("applicant", {
        firstName: form.firstName,
        lastName: form.lastName,
        province: form.province,
        qualification: form.qualification,
      });

      console.log("Applicant created:", user?.uid);

<<<<<<< HEAD
      navigate("/dashboard/createProfile");
=======
      navigate("/dashboard/applicant");
>>>>>>> d8db91e1a2df0b0b6aaa46a41b4380a4801be230

    } catch (error) {
      console.error("Signup error:", error);

      setErrorMsg(
        error?.message || "Signup failed. Please try again."
      );

<<<<<<< HEAD
    } finally {
      setLoading(false);
    }
>>>>>>> Stashed changes
=======
>>>>>>> b086a4c7512174d6ae59bae88c2719c9bcfecb2d
    } finally {
      setLoading(false);
    }
>>>>>>> d8db91e1a2df0b0b6aaa46a41b4380a4801be230
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
<<<<<<< HEAD
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
=======
    <form onSubmit={handleGoogleSignup}>
      <fieldset>
        <legend>Personal details</legend>

        {errorMsg && (
          <p style={{ color: "red", marginBottom: "10px" }}>
            {errorMsg}
          </p>
        )}
>>>>>>> b086a4c7512174d6ae59bae88c2719c9bcfecb2d

        <label>
          First name
          <input
<<<<<<< HEAD
            type="email"
            value={form.email}
            onChange={set("email")}
=======
            value={form.firstName}
            onChange={set("firstName")}
>>>>>>> b086a4c7512174d6ae59bae88c2719c9bcfecb2d
            required
          />
        </label>

        <label>
          Last name
          <input
<<<<<<< HEAD
            type="password"
            value={form.password}
            onChange={set("password")}
=======
            value={form.lastName}
            onChange={set("lastName")}
>>>>>>> b086a4c7512174d6ae59bae88c2719c9bcfecb2d
            required
          />
        </label>

        <label>
          Province
          <select value={form.province} onChange={set("province")} required>
            <option value="">Select province</option>
            {PROVINCES.map((p) => (
<<<<<<< HEAD
              <option key={p}>{p}</option>
=======
              <option key={p} value={p}>
                {p}
              </option>
>>>>>>> b086a4c7512174d6ae59bae88c2719c9bcfecb2d
            ))}
          </select>
        </label>

        <label>
<<<<<<< HEAD
          Highest qualification
          <NqfDropdown
            value={form.qualification}
            onChange={set("qualification")}
            required
          />
=======
          Qualification
          <select
            value={form.qualification}
            onChange={set("qualification")}
            required
          >
            <option value="">Select NQF level</option>
            {NQF_LEVELS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
>>>>>>> b086a4c7512174d6ae59bae88c2719c9bcfecb2d
        </label>
      </fieldset>

      <button type="submit" disabled={loading}>
<<<<<<< HEAD
        {loading ? "Creating account..." : "Create account"}
      </button>

      <button type="button" onClick={handleGoogleSignup} disabled={loading}>
        {loading ? "Signing in with Google..." : "Sign up with Google"}
=======
        {loading ? "Signing up..." : "Continue with Google"}
>>>>>>> b086a4c7512174d6ae59bae88c2719c9bcfecb2d
      </button>
    </form>
  );
}
