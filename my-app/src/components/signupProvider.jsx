import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpWithEmail, signUpWithGoogle } from '../services/authService';

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

  const [form, setForm] = useState({
    organisationName: '',
    contactName: '',
    sector: '',
    province: '',
    description: '',
  });

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const validateForm = () => {
    if (!form.organisationName.trim()) return "Organisation name is required";
    if (!form.contactName.trim()) return "Contact person is required";
    if (!form.sector) return "Sector is required";
    if (!form.province) return "Province is required";
    return null;
  };

  const isFormValid = !validateForm();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanEmail = form.email.trim().toLowerCase();

      const user = await signUpWithEmail(
        cleanEmail,
        form.password,
        "provider",
        {
          organisationName: form.organisationName,
          contactName: form.contactName,
          sector: form.sector,
          province: form.province,
          description: form.description,
        }
      );

      console.log("Provider created:", user);

      navigate("/dashboard/provider");
    } catch (error) {
      console.error(error);
      alert("Provider signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const validateForm = () => {
    if (!form.organisationName.trim()) return "Organisation name is required";
    if (!form.contactName.trim()) return "Contact person is required";
    if (!form.sector) return "Sector is required";
    if (!form.province) return "Province is required";
    return null;
  };

  const isFormValid = !validateForm();
    setLoading(true);

    try {
      const user = await signUpWithGoogle("provider");

      console.log("Google provider user:", user);

      navigate("/dashboard/provider");
    } catch (error) {
      console.error(error);
      alert("Google signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Organisation details</legend>

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

      

      

      <button type="button" onClick={handleGoogleSignup} disabled={loading || !isFormValid}>
        {loading ? "Signing in..." : "Sign up with Google"}
      </button>
    </form>
  );
}