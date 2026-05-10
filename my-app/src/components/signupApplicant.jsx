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
    province: "",
    qualification: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleGoogleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // validation
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.province ||
      !form.qualification
    ) {
      setErrorMsg("Please fill in all required fields before continuing.");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const user = await signUpWithGoogle("applicant", {
        firstName: form.firstName,
        lastName: form.lastName,
        province: form.province,
        qualification: form.qualification,
      });

      console.log("Applicant created/login success:", user.uid);

      navigate("/dashboard/applicant");

    } catch (error) {
      console.error(error);
      setErrorMsg("This Google account is already registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleGoogleSignup}>

      <fieldset>
        <legend>Personal details</legend>

        {errorMsg && (
          <p style={{ color: "red", marginBottom: "10px" }}>
            {errorMsg}
          </p>
        )}

        <label>
          First name
          <input
            value={form.firstName}
            onChange={set("firstName")}
            required
          />
        </label>

        <label>
          Last name
          <input
            value={form.lastName}
            onChange={set("lastName")}
            required
          />
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
          <select
            value={form.qualification}
            onChange={set("qualification")}
            required
          >
            <option value="">Select NQF level</option>
            {NQF_LEVELS.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </fieldset>

      <button type="submit" disabled={loading}>
        {loading ? "Signing up..." : "Continue with Google"}
      </button>

    </form>
  );
}