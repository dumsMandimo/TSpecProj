import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpWithEmail, signUpWithGoogle } from '../services/authService';

export default function SignupAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = form.email.trim().toLowerCase();

      await signUpWithEmail(
        cleanEmail,
        form.password,
        "admin",
        {
          fullName: form.fullName,
        }
      );

      navigate("/dashboard/admin");

    } catch (error) {
      console.error(error);
      alert("Admin signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);

    try {
      await signUpWithGoogle("admin");
      navigate("/dashboard/admin");
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
        <legend>Admin details</legend>

        <label>
          Full name
          <input
            type="text"
            value={form.fullName}
            onChange={set('fullName')}
            required
          />
        </label>

        <label>
          Email address
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
            required
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            required
          />
        </label>
      </fieldset>

      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create admin account"}
      </button>

      <button type="button" onClick={handleGoogleSignup} disabled={loading}>
        {loading ? "Signing in with Google..." : "Sign up with Google"}
      </button>
    </form>
  );
}