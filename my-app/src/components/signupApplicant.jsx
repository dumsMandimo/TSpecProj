import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const NQF_LEVELS = [
  'NQF 1 — General Certificate',
  'NQF 2 — Elementary Certificate',
  'NQF 3 — Intermediate Certificate',
  'NQF 4 — National Certificate (Matric)',
  'NQF 5 — Higher Certificate',
  'NQF 6 — Diploma / Advanced Certificate',
  'NQF 7 — Bachelor\'s Degree',
  'NQF 8 — Honours / Postgrad Diploma',
  'NQF 9 — Master\'s Degree',
  'NQF 10 — Doctoral Degree',
];

const PROVINCES = [
  'Eastern Cape','Free State','Gauteng','KwaZulu-Natal',
  'Limpopo','Mpumalanga','Northern Cape','North West','Western Cape',
];

export default function SignupApplicant() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', province: '', qualification: '',
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
<<<<<<< Updated upstream
    navigate('/dashboard/applicant');
=======
    setErrorMsg("");

    // Prevent double submit early
    if (loading) return;
    setLoading(true);

    // Validation
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
      const user = await signUpWithGoogle("applicant", {
        firstName: form.firstName,
        lastName: form.lastName,
        province: form.province,
        qualification: form.qualification,
      });

      console.log("Applicant created:", user?.uid);

      navigate("/dashboard/createProfile");

    } catch (error) {
      console.error("Signup error:", error);

      setErrorMsg(
        error?.message || "Signup failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
>>>>>>> Stashed changes
  };

  return (
    <form onSubmit={handleSubmit} >
      <fieldset>
        <legend>Personal details</legend>

        <p className="field-row">
          <label>
            First name
            <input
              type="text"
              placeholder="Thabo"
              value={form.firstName}
              onChange={set('firstName')}
              required
            />
          </label>
          <label>
            Last name
            <input
              type="text"
              placeholder="Nkosi"
              value={form.lastName}
              onChange={set('lastName')}
              required
            />
          </label>
        </p>

        <label>
          Email address
          <input
            type="email"
            placeholder="thabo@email.com"
            value={form.email}
            onChange={set('email')}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={set('password')}
            required
          />
        </label>

        <label>
          Province
          <select value={form.province} onChange={set('province')} required>
            <option value="">Select province</option>
            {PROVINCES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>

        <label>
          Highest qualification
          <select value={form.qualification} onChange={set('qualification')} required>
            <option value="">Select NQF level</option>
            {NQF_LEVELS.map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
      </fieldset>

      <button type="submit">Create account</button>
    </form>
  );
}