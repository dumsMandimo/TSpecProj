import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";
import { sendEmailVerification, onAuthStateChanged } from "firebase/auth";

export default function VerifyEmail() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  // FIX: safely track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsubscribe();
  }, []);

  const resendEmail = async () => {
    setLoading(true);
    setMessage("");

    try {
      if (!user) {
        setMessage("No user found. Please log in again.");
        return;
      }

      await sendEmailVerification(user);
      setMessage("Verification email sent. Please check your inbox.");

    } catch (error) {
      console.error(error);
      setMessage("Failed to send verification email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkVerification = async () => {
  setLoading(true);
  setMessage("");

  try {
    const user = auth.currentUser;

    if (!user) {
      setMessage("No user found. Please log in again.");
      return;
    }

    await user.reload();

    if (user.emailVerified) {
      navigate("/login");
    } else {
      setMessage("Email not verified yet. Check your inbox or wait a bit.");
    }

  } catch (error) {
    console.error(error);
    setMessage("Error checking verification status.");
  } finally {
    setLoading(false);
  }
};

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <h1 style={styles.title}>Verify Your Email</h1>

        <p style={styles.text}>
          We’ve sent a verification link to your email. Please check your inbox.
        </p>

        {message && <p style={styles.message}>{message}</p>}

        <button style={styles.button} onClick={resendEmail} disabled={loading}>
          {loading ? "Sending..." : "Resend Email"}
        </button>

        <button
          style={styles.buttonOutline}
          onClick={checkVerification}
          disabled={loading}
        >
          {loading ? "Checking..." : "I’ve Verified My Email"}
        </button>
      </section>
    </main>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  card: {
    width: "420px",
    padding: "30px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
  title: {
    color: "#ff7a00",
    marginBottom: "15px",
  },
  text: {
    marginBottom: "15px",
    color: "#333",
  },
  message: {
    marginBottom: "15px",
    color: "#444",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#ff7a00",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    marginBottom: "10px",
    cursor: "pointer",
  },
  buttonOutline: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#fff",
    color: "#ff7a00",
    border: "2px solid #ff7a00",
    borderRadius: "8px",
    cursor: "pointer",
  },
};