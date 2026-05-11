import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { signUpWithEmail, signUpWithGoogle } from '../services/authService';
=======
import { signUpWithGoogle } from '../services/authService';
>>>>>>> dev-auth-fix

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
<<<<<<< HEAD
=======
  const [errorMsg, setErrorMsg] = useState("");
>>>>>>> dev-auth-fix

  const [form, setForm] = useState({
    organisationName: '',
    contactName: '',
<<<<<<< HEAD
    email: '',
    password: '',
=======
>>>>>>> dev-auth-fix
    sector: '',
    province: '',
    description: '',
  });

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

<<<<<<< HEAD
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
    setLoading(true);

    try {
      const user = await signUpWithGoogle("provider");

      console.log("Google provider user:", user);

      navigate("/dashboard/provider");
    } catch (error) {
      console.error(error);
      alert("Google signup failed");
=======
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
>>>>>>> dev-auth-fix
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Organisation details</legend>

=======
    <form>
      <fieldset>
        <legend>Organisation details</legend>

        {errorMsg && (
          <p style={{ color: "red", marginBottom: "10px" }}>
            {errorMsg}
          </p>
        )}

>>>>>>> dev-auth-fix
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

<<<<<<< HEAD
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
=======
      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={loading}
      >
        {loading ? "Signing in..." : "Continue with Google"}
>>>>>>> dev-auth-fix
      </button>
    </form>
  );
}