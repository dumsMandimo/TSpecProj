import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUpWithGoogle } from "../services/authService";

const SECTORS = [
  "Agriculture",
  "Construction",
  "Education",
  "Energy",
  "Finance",
  "Healthcare",
  "Hospitality",
  "ICT",
  "Manufacturing",
  "Mining",
  "Public Service",
  "Retail",
  "Transport",
  "Other",
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

export default function SignupProvider() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    organisationName: "",
    contactName: "",
    sector: "",
    province: "",
    description: "",
  });

  const set = (field) => (e) =>
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

  const validateForm = () => {
    if (!form.organisationName.trim()) return "Organisation name is required";
    if (!form.contactName.trim()) return "Contact person is required";
    if (!form.sector) return "Sector is required";
    if (!form.province) return "Province is required";
    if (!form.description.trim()) return "Description is required";
    return null;
  };

  const handleGoogleSignup = async () => {
    setErrorMsg("");

    if (loading) return;

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);

    try {
      const user = await signUpWithGoogle("provider", {
        organisationName: form.organisationName,
        contactName: form.contactName,
        sector: form.sector,
        province: form.province,
        description: form.description,
        status: "pending",         // <-- ADDED: sets pending status on signup
      });

      console.log("Provider signup successful:", user?.uid);

      navigate("/pending-approval"); // <-- CHANGED: was /dashboard/provider
    } catch (error) {
      console.error("Signup failed:", error);
      setErrorMsg(error?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form noValidate>
      <fieldset>
        <legend>Organisation details</legend>

        {errorMsg && (
          <p style={{ color: "red", marginBottom: "10px" }}>
            {errorMsg}
          </p>
        )}

        <label>
          Organisation name
          <input
            type="text"
            value={form.organisationName}
            onChange={set("organisationName")}
            required
          />
        </label>

        <label>
          Contact person
          <input
            type="text"
            value={form.contactName}
            onChange={set("contactName")}
            required
          />
        </label>

        <label>
          Sector
          <select
            value={form.sector}
            onChange={set("sector")}
            required
          >
            <option value="">Select sector</option>
            {SECTORS.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        </label>

        <label>
          Province
          <select
            value={form.province}
            onChange={set("province")}
            required
          >
            <option value="">Select province</option>
            {PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </label>

        <label>
          Description
          <textarea
            value={form.description}
            onChange={set("description")}
            rows={4}
            required
          />
        </label>
      </fieldset>

      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={loading}
      >
        {loading ? "Signing up..." : "Continue with Google"}
      </button>
    </form>
  );
}