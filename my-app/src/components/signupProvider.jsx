import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [form, setForm] = useState({
    organisationName: '', contactName: '', email: '',
    password: '', sector: '', province: '', description: '',
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Provider signup:', form);
    alert('Provider form submitted! (MVP — no backend yet)');
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Organisation details</legend>

        <label>
          Organisation name
          <input
            type="text"
            placeholder="Acme Training (Pty) Ltd"
            value={form.organisationName}
            onChange={set('organisationName')}
            required
          />
        </label>

        <label>
          Contact person
          <input
            type="text"
            placeholder="Nomvula Dlamini"
            value={form.contactName}
            onChange={set('contactName')}
            required
          />
        </label>

        <p className="field-row">
          <label>
            Sector
            <select value={form.sector} onChange={set('sector')} required>
              <option value="">Select sector</option>
              {SECTORS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label>
            Province
            <select value={form.province} onChange={set('province')} required>
              <option value="">Select province</option>
              {PROVINCES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
        </p>

        <label>
          Description
          <textarea
            placeholder="Briefly describe your organisation..."
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
            placeholder="nomvula@org.co.za"
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
      </fieldset>

      <button type="submit">Register organisation</button>
    </form>
  );
}