import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUpWithGoogle } from "../services/authService";
import { SectorDropdown } from "./nqfSelect";

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

  const [form, setForm] = useState({
    organisationName: "",
    contactName: "",
    sector: "",
    province: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

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
      const { user, existingUser, role } = await signUpWithGoogle("provider", {
        organisationName: form.organisationName,
        contactName: form.contactName,
        sector: form.sector,
        province: form.province,
        description: form.description,
      });

      if (existingUser) {
        setErrorMsg("You already have an account. Please log in.");
        setLoading(false);
        return;
      }

      if (role && role !== "provider") {
        setErrorMsg(
          "You already have an account with a different role. Please log in.",
        );
        setLoading(false);
        return;
      }

      console.log("Provider created:", user?.uid);
      navigate("/pending-approval");
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
          <p style={{ color: "red", marginBottom: "10px" }}>{errorMsg}</p>
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
          <SectorDropdown
            value={form.sector}
            onChange={set("sector")}
            required
          />
        </label>

        <label>
          Province
          <select value={form.province} onChange={set("province")} required>
            <option value="">Select province</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
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

      <button type="button" onClick={handleGoogleSignup} disabled={loading}>
        {loading ? "Signing up..." : "Continue with Google"}
      </button>
    </form>
  );
}
