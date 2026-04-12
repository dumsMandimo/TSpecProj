import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

export default function SignupAdmin() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const email = form.email.trim();
    const password = form.password;

    // ✅ VALIDATION FIRST (before loading)
    if (!form.fullName.trim()) {
      alert("Full name is required");
      return;
    }

    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    if (password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!password || password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      // 🔐 create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.toLowerCase(),
        password
      );

      // 👤 update display name
      await updateProfile(userCredential.user, {
        displayName: form.fullName,
      });

      // 🗄️ save to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName: form.fullName,
        email,
        role: "admin",
        createdAt: new Date(),
      });

      console.log("ADMIN CREATED SUCCESSFULLY");

      alert("Admin account created successfully!");

      // reset form
      setForm({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        alert("This email is already registered.");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email format.");
      } else {
        alert(error.message);
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset>
        <legend>Admin details</legend>

        <label>
          Full name
          <input
            type="text"
            value={form.fullName}
            onChange={set("fullName")}
            required
          />
        </label>

        <label>
          Email address
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            required
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            required
          />
        </label>
      </fieldset>

      <button type="submit" disabled={loading}>
        {loading ? "Creating admin..." : "Create admin account"}
      </button>
    </form>
  );
}