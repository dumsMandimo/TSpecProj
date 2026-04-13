import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import './loginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Logged in successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <main className="login">
      <h4>Sign in to your account</h4>
      <form onSubmit={handleSubmit}>
        <label className="text_area">
          <input
            type="email"
            placeholder="Email"
            className="text_input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="text_area">
          <input
            type="password"
            placeholder="Password"
            className="text_input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <input type="submit" value="LOGIN" className="btn" />
      </form>
      <a className="link" href="/signup">Sign Up</a>
    </main>
  );
}