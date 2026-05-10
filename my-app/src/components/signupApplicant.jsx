import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { NqfDropdown } from "../components/nqfSelect.jsx";
import { signUpWithGoogle, signUpWithEmail } from "../services/authService";

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
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (loading) return;
    setLoading(true);

    try {
      const cleanEmail = form.email.trim().toLowerCase();

      const user = await signUpWithEmail(cleanEmail, form.password, "applicant", {
        firstName: form.firstName,
        lastName: form.lastName,
        province: form.province,
        qualification: form.qualification,
      });

      console.log("User created:", user);

      navigate("/dashboard/createProfile");
    } catch (error) {
      console.error("Signup failed:", error);
      setErrorMsg(error?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE SIGNUP
  const handleGoogleSignup = async () => {
    setErrorMsg("");

    if (loading) return;
    setLoading(true);

    try {
      const user = await signUpWithGoogle("applicant", {
        firstName: form.firstName,
        lastName: form.lastName,
        province: form.province,
        qualification: form.qualification,
      });

      console.log("Google user created:", user?.uid);

      navigate("/dashboard/createProfile");
    } catch (error) {
      console.error("Google signup failed:", error);
      setErrorMsg(error?.message || "Google sign-in failed.");
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
          Province
          <select
            value={form.province}
            onChange={set("province")}
            required
          >
            <option value="">Select province</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label>
          Highest qualification
          <NqfDropdown
            value={form.qualification}
            onChange={set("qualification")}
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