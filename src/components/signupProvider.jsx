import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpWithGoogle } from '../services/authService';

const SECTORS = [
  'Agriculture','Construction','Education','Energy','Finance',
  'Healthcare','Hospitality','ICT','Manufacturing','Mining',
  'Public Service','Retail','Transport','Other',
];

const PROVINCES = [
  'Eastern Cape','Free State','Gauteng','KwaZulu-Natal',
  'Limpopo','Mpumalanga','Northern Cape','North West','Western Cape',
];

export default function SignupProvider() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    organisationName: '',
    contactName: '',
    sector: '',
    province: '',
    description: '',
  });

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleGoogleSignup = async () => {
    if (loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      if (
        !form.organisationName ||
        !form.contactName ||
        !form.sector ||
        !form.province
      ) {
        setErrorMsg("Please fill in all required fields.");
        return;
      }

      const user = await signUpWithGoogle("provider", {
        organisationName: form.organisationName,
        contactName: form.contactName,
        sector: form.sector,
        province: form.province,
        description: form.description,
      });

      console.log("Provider created:", user.uid);

      navigate("/dashboard/provider");
    } catch (error) {
      console.error("Provider signup failed:", error);
      setErrorMsg("Provider signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form>
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
            onChange={set('organisationName')}
            required
          />
        </label>

        <label>
          Contact person
          <input
            type="text"
            value={form.contactName}
            onChange={set('contactName')}
            required
          />
        </label>

        <label>
          Sector
          <select value={form.sector} onChange={set('sector')} required>
            <option value="">Select sector</option>
            {SECTORS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <label>
          Province
          <select value={form.province} onChange={set('province')} required>
            <option value="">Select province</option>
            {PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>

        <label>
          Description
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={3}
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