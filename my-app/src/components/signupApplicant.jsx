import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { signUpWithGoogle } from "../services/authService";
import { NqfDropdown } from "./nqfSelect";

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

      if (existingUser) {
        setErrorMsg("You already have an account. Please log in.");
        setLoading(false);
        return;
      }

      if (role && role.toLowerCase() !== "applicant") {
        setErrorMsg(
          "You already have an account with a different role. Please log in."
        );
        setLoading(false);
        return;
      }

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
          <p style={{ color: "#b00020", marginBottom: "10px" }}>{errorMsg}</p>
        )}

        <div className="field-row">
          <label>
            First name *
            <input
              name="firstName"
              value={form.firstName}
              onChange={setField("firstName")}
              placeholder="e.g. Thabo"
              autoComplete="given-name"
              required
            />
          </label>

          <label>
            Last name *
            <input
              name="lastName"
              value={form.lastName}
              onChange={setField("lastName")}
              placeholder="e.g. Mokoena"
              autoComplete="family-name"
              required
            />
          </label>
        </div>

        <label>
          Province *
          <select
            name="province"
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
          Highest qualification (NQF) *
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