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

    
    <main className="login-page">

      <aside className="login-left">
        <header className="brand">
          <span className="brand-mark">UBUNTY</span>
          <span className="brand-name">CAREERS</span>
        </header>
        <section className="hero">
          <h1>Connect.<br />Learn.<br />Grow.</h1>
          <p>South Africa's platform linking work-seekers with SETA-accredited learnerships, apprenticeships and internships.</p>
        </section>
        <ul className="stats">
          <li><strong>12k+</strong><span>Opportunities</span></li>
          <li><strong>800+</strong><span>Providers</span></li>
          <li><strong>9</strong><span>Provinces</span></li>
        </ul>
      </aside>


      <section className="login-right">
      <h4>Sign in to your account</h4>
      <p className="subtitle">Welcome back!</p>

      <section role="tabpanel" className="form-panel">
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
      </section>
      <p className="login-prompt">Already have an account? <a href="/">Sign Up</a>
      </p>
      </section>
    </main>
  );
}