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
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    organisationName: '',
    contactName: '',
    email: '',
    password: '',
    sector: '',
    province: '',
    description: '',
  });

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setErrorMsg("");

    if (form.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      const cleanEmail = form.email.trim().toLowerCase();

      await signUpWithEmail(
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

      console.log("Provider created");

      // ✅ FIX ADDED HERE
      localStorage.setItem("role", "provider");

      navigate("/dashboard/provider");

    } catch (error) {
      console.error("Provider signup failed:", error);

      switch (error.code) {
        case "auth/email-already-in-use":
          setErrorMsg("This account already exists. Please log in instead.");
          break;

        case "auth/invalid-email":
          setErrorMsg("Please enter a valid email address.");
          break;

        case "auth/weak-password":
          setErrorMsg("Password is too weak.");
          break;

        default:
          setErrorMsg("Provider signup failed. Please try again.");
          break;
      }

    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      await signUpWithGoogle("provider");

      console.log("Provider Google signup successful");

      // optional consistency fix
      localStorage.setItem("role", "provider");

      navigate("/dashboard/provider");

    } catch (error) {
      console.error("Google signup failed:", error);
      setErrorMsg("Google signup failed. Please try again.");

    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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

      <fieldset>
        <legend>Login details</legend>

        <label>
          Work email
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            minLength={8}
            required
          />
        </label>
      </fieldset>

      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Register organisation"}
      </button>

      <button type="button" onClick={handleGoogleSignup} disabled={loading}>
        {loading ? "Signing in..." : "Sign up with Google"}
      </button>
    </form>
  );
}