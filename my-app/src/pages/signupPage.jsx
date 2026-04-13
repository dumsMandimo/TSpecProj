import { useState } from 'react';
import SignupApplicant from '../components/signupApplicant';
import SignupProvider from '../components/signupProvider';
import SignupAdmin from '../components/signupAdmin';
import './signupPage.css';

const ROLES = [
  { key: 'applicant', label: 'Applicant', desc: 'Looking for learnerships & internships' },
  { key: 'provider',  label: 'Provider',  desc: 'Employer or training organisation' },
  { key: 'admin',     label: 'Admin',     desc: 'Platform administrator' },
];

export default function SignupPage({ onSignupComplete }) {
  const [activeRole, setActiveRole] = useState('applicant');

  const forms = {
    applicant: <SignupApplicant />,
    provider:  <SignupProvider />,
    admin:     <SignupAdmin />,
  };

  const handleSubmit = () => {
    if (onSignupComplete) {
      onSignupComplete(activeRole);
    }
  };

  return (
    <main className="signup-page">

      <aside className="signup-left">
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

      <section className="signup-right">
        <h2>Create your account</h2>
        <p className="subtitle">Choose your role to get started</p>

        <nav aria-label="Account type">
          <ul className="role-tabs" role="tablist">
            {ROLES.map(({ key, label, desc }) => (
              <li key={key} role="presentation">
                <button
                  role="tab"
                  type="button"
                  aria-selected={activeRole === key}
                  className={activeRole === key ? 'active' : ''}
                  onClick={() => setActiveRole(key)}
                >
                  <span className="tab-label">{label}</span>
                  <span className="tab-desc">{desc}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section
          role="tabpanel"
          aria-label={`${activeRole} signup form`}
          className="form-panel"
        >
          {forms[activeRole]}

          {/* ADD BUTTON TO TRIGGER SIGNUP COMPLETE */}
          <button onClick={handleSubmit} type="button">
            Create Account
          </button>
        </section>

        <p className="login-prompt">
          Already have an account? <a href="/loginPage">Sign in</a>
        </p>
      </section>

    </main>
  );
}