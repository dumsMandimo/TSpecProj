import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import "./providerApproval.css";

export default function PendingApproval() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="brand">
          <div className="brand-mark">U</div>
          <span className="brand-name">UbuntuCareers</span>
        </div>
        <div className="hero">
          <h1>Connecting talent with opportunity.</h1>
          <p>South Africa's platform for job seekers and providers building the workforce of tomorrow.</p>
        </div>
        <ul className="stats">
          <li><strong>12k+</strong><span>Job seekers</span></li>
          <li><strong>340+</strong><span>Providers</span></li>
          <li><strong>9</strong><span>Provinces</span></li>
        </ul>
      </div>

      <div className="login-right">
        <div className="status-badge">
          <span className="dot"></span>
          Pending approval
        </div>

        <h4>Your account is under review</h4>
        <p className="subtitle">
          Thanks for registering as a provider. Our team is reviewing your
          details — you'll be notified by email once approved.
        </p>

        <div className="form-panel">
          <div className="steps">

            <div className="step">
              <div className="step-icon done">✓</div>
              <div className="step-text">
                <strong>Account created</strong>
                <span>Your organisation details have been submitted</span>
              </div>
            </div>

            <div className="step-divider" />

            <div className="step">
              <div className="step-icon pending">⏳</div>
              <div className="step-text">
                <strong>Under review</strong>
                <span>Admin is verifying your organisation — typically 1–2 business days</span>
              </div>
            </div>

            <div className="step-divider" />

            <div className="step">
              <div className="step-icon waiting">🏢</div>
              <div className="step-text">
                <strong>Access granted</strong>
                <span>Post opportunities and manage your provider dashboard</span>
              </div>
            </div>

          </div>
        </div>

        <div className="info-box">
          <p>
            We'll send a confirmation to the email linked to your Google account.
            Check your spam folder if you don't see it within 2 business days.
          </p>
        </div>

        <button className="btn" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}