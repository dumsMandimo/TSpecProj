<<<<<<< HEAD
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectorDropdown } from "../components/nqfSelect.jsx";
=======
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpWithGoogle } from '../services/authService';

const SECTORS = [
  'Agriculture','Construction','Education','Energy','Finance',
  'Healthcare','Hospitality','ICT','Manufacturing','Mining',
  'Public Service','Retail','Transport','Other',
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

export default function SignupProvider() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
<<<<<<< HEAD
    organisationName: "",
    contactName: "",
    email: "",
    password: "",
    sector: "",
    province: "",
    description: "",
=======
    organisationName: '',
    contactName: '',
    sector: '',
    province: '',
    description: '',
>>>>>>> b086a4c7512174d6ae59bae88c2719c9bcfecb2d
  });

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleGoogleSignup = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
    navigate("/dashboard/provider");
=======

    setErrorMsg("");

    if (loading) return;

    // Validation
    if (
      !form.organisationName.trim() ||
      !form.contactName.trim() ||
      !form.sector ||
      !form.province ||
      !form.description.trim()
    ) {
      setErrorMsg("Please fill in all required fields before continuing.");
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
      });

      console.log("Provider Google signup successful:", user?.uid);

      navigate("/dashboard/provider");

    } catch (error) {
      console.error(error);
      setErrorMsg(error?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
>>>>>>> b086a4c7512174d6ae59bae88c2719c9bcfecb2d
  };

  return (
    <form onSubmit={handleGoogleSignup}>
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

<<<<<<< HEAD
        <p className="field-row">
          <label>
            Sector
            <SectorDropdown
              value={form.qualification}
              onChange={set("sector")}
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
        </p>
=======
        <label>
          Sector
          <select value={form.sector} onChange={set('sector')} required>
            <option value="">Select sector</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label>
          Province
          <select value={form.province} onChange={set('province')} required>
            <option value="">Select province</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
>>>>>>> b086a4c7512174d6ae59bae88c2719c9bcfecb2d

        <label>
          Description
          <textarea
            value={form.description}
            onChange={set("description")}
            rows={3}
<<<<<<< HEAD
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Login details</legend>

        <label>
          Work email
          <input
            type="email"
            placeholder="nomvula@org.co.za"
            value={form.email}
            onChange={set("email")}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={set("password")}
            minLength={8}
=======
>>>>>>> b086a4c7512174d6ae59bae88c2719c9bcfecb2d
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
