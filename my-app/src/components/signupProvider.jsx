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

  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validateForm = () => {
    if (!form.organisationName.trim()) return "Organisation name is required.";
    if (!form.contactName.trim()) return "Contact person is required.";
    if (!form.sector) return "Sector is required.";
    if (!form.province) return "Province is required.";
    if (!form.description.trim()) return "Description is required.";
    return null;
  };

  const handleGoogleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (loading) return;

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);

    try {
      const { existingUser, role } = await signUpWithGoogle("provider", {
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

      if (role && role.toLowerCase() !== "provider") {
        setErrorMsg(
          "You already have an account with a different role. Please log in."
        );
        setLoading(false);
        return;
      }

      navigate("/pending-approval");
    } catch (error) {
      console.error("Signup failed:", error);
      setErrorMsg(error?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleGoogleSignup} noValidate>
      <fieldset>
        <legend>Organisation details</legend>

        {errorMsg && (
          <p style={{ color: "#b00020", marginBottom: "10px" }}>{errorMsg}</p>
        )}

        <div className="field-row">
          <label>
            Organisation name *
            <input
              type="text"
              name="organisationName"
              value={form.organisationName}
              onChange={setField("organisationName")}
              placeholder="e.g. Ubuntu Training Academy"
              autoComplete="organization"
              required
            />
          </label>

          <label>
            Contact person *
            <input
              type="text"
              name="contactName"
              value={form.contactName}
              onChange={setField("contactName")}
              placeholder="e.g. Sarah Nkosi"
              autoComplete="name"
              required
            />
          </label>
        </div>

        <label>
          Sector *
          <SectorDropdown
            value={form.sector}
            onChange={setField("sector")}
            required
          />
        </label>

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
          Description *
          <textarea
            name="description"
            value={form.description}
            onChange={setField("description")}
            placeholder="Briefly describe your organisation and the opportunities you offer"
            rows={4}
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