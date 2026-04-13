import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignupAdmin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    navigate('/dashboard/admin');
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Admin details</legend>

        <label>
          Full name
          <input
            type="text"
            placeholder="Zanele Mokoena"
            value={form.fullName}
            onChange={set('fullName')}
            required
          />
        </label>

        <label>
          Email address
          <input
            type="email"
            placeholder="admin@portal.co.za"
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
            minLength={8}
            required
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            minLength={8}
            required
          />
        </label>
      </fieldset>

      <button type="submit">Create admin account</button>
    </form>
  );
}