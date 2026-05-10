import { useNavigate } from "react-router-dom";
import { useState } from "react";
import NqfSelect from "../components/nqfSelect.jsx";
//import { signUpWithEmail, signUpWithGoogle } from "../services/authService";

const NQF_LEVELS = [
  { group: "NQF 1", options: ["General Certificate"] },
  { group: "NQF 2", options: ["Elementary Certificate"] },
  { group: "NQF 3", options: ["Intermediate Certificate"] },
  { group: "NQF 4", options: ["National Certificate"] },
  { group: "NQF 5", options: ["Higher Certificate"] },
  { group: "NQF 6", options: ["Diploma", "Advanced Certificate"] },
  { group: "NQF 7", options: ["Bachelor's Degree", "Advanced Diploma"] },
  {
    group: "NQF 8",
    options: ["Bachelor Honours Degree", "Postgraduate Diploma"],
  },
  {
    group: "NQF 9",
    options: ["Master's Degree", "Master's Degree (Professional)"],
  },
  {
    group: "NQF 10",
    options: ["Doctoral Degree (Professional)", "Doctoral Degree"],
  },
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
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

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
        },
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
          Highest qualification
          <NqfSelect
            value={form.qualification}
            onChange={set("qualification")}
            required
          />
        </label>
      </fieldset>

      <button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </button>

      <button type="button" onClick={handleGoogleSignup} disabled={loading}>
        {loading ? "Signing in with Google..." : "Sign up with Google"}
      </button>
    </form>
  );
}
