import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { signUpWithGoogle } from "../services/authService";
import { NqfDropdown } from "./nqfSelect";

const NQF_LEVELS = [
  "NQF 1 — General Certificate",
  "NQF 2 — Elementary Certificate",
  "NQF 3 — Intermediate Certificate",
  "NQF 4 — National Certificate (Matric)",
  "NQF 5 — Higher Certificate",
  "NQF 6 — Diploma / Advanced Certificate",
  "NQF 7 — Bachelor's Degree",
  "NQF 8 — Honours / Postgrad Diploma",
  "NQF 9 — Master's Degree",
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

  const setField = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleGoogleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (loading) return;
    setLoading(true);

    // Validate required fields
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
      const { user, existingUser, role } = await signUpWithGoogle("applicant", {
        firstName: form.firstName,
        lastName: form.lastName,
        province: form.province,
        qualification: form.qualification,
      });

      console.log("Applicant created:", user?.uid);
      console.log("Role returned:", role);

      // Block if account already exists
      if (existingUser) {
        setErrorMsg("You already have an account. Please log in.");
        setLoading(false);
        return;
      }

      // Prevent login if role is not applicant
      if (role && role.toLowerCase() !== "applicant") {
        setErrorMsg("You already have an account with a different role. Please log in.");
        setLoading(false);
        return;
      }

      // Navigate to the correct applicant dashboard
      navigate("/dashboard/applicant/createProfile");
    } catch (error) {
      console.error("Signup error:", error);
      setErrorMsg(error?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleGoogleSignup}>
      <fieldset>
        <legend>Personal details</legend>

        {errorMsg && (
          <p style={{ color: "red", marginBottom: "10px" }}>{errorMsg}</p>
        )}

        <label>
          First name
          <input
            value={form.firstName}
            onChange={setField("firstName")}
            required
          />
        </label>

        <label>
          Last name
          <input
            value={form.lastName}
            onChange={setField("lastName")}
            required
          />
        </label>

        <label>
          Province
          <select
            value={form.province}
            onChange={setField("province")}
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
          Qualification
          <NqfDropdown
            value={form.qualification}
            onChange={setField("qualification")}
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
