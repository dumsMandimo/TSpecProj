import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";

const NQF_LEVELS = [
  "NQF 1 — General Certificate",
  "NQF 2 — Elementary Certificate",
  "NQF 3 — Intermediate Certificate",
  "NQF 4 — National Certificate (Matric)",
  "NQF 5 — Higher Certificate",
  "NQF 6 — Diploma / Advanced Certificate",
  "NQF 7 — Bachelor’s Degree",
  "NQF 8 — Honours / Postgrad Diploma",
  "NQF 9 — Master’s Degree",
  "NQF 10 — Doctoral Degree",
];

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

export default function SignupApplicant() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    province: "",
    qualification: "",
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

    console.log("🔥 SUBMIT STARTED");
    setLoading(true);

    const email = form.email.trim();
    const password = form.password;

    // --------------------
    // VALIDATION (BEFORE FIREBASE)
    // --------------------
    if (!form.firstName.trim()) {
      alert("First name is required");
      setLoading(false);
      return;
    }

    if (!form.lastName.trim()) {
      alert("Last name is required");
      setLoading(false);
      return;
    }

    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!password || password.length < 8) {
      alert("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (!form.province) {
      alert("Please select a province");
      setLoading(false);
      return;
    }

    if (!form.qualification) {
      alert("Please select a qualification");
      setLoading(false);
      return;
    }

    try {
      console.log("➡️ Creating Firebase user...");

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.toLowerCase(),
        password
      );

      console.log("✅ Firebase user created:", userCredential.user.uid);

      try {
        console.log("➡️ Updating profile...");

        await updateProfile(userCredential.user, {
          displayName: `${form.firstName} ${form.lastName}`,
        });

        console.log("✅ Profile updated");
      } catch (profileError) {
        console.error("❌ Profile update failed:", profileError);
      }

      try {
        console.log("➡️ Writing to Firestore...");

        await setDoc(doc(db, "users", userCredential.user.uid), {
          firstName: form.firstName,
          lastName: form.lastName,
          email,
          province: form.province,
          qualification: form.qualification,
          role: "applicant",
          createdAt: new Date().toISOString(),
        });

        console.log("✅ Firestore write success");
      } catch (firestoreError) {
        console.error("❌ Firestore failed:", firestoreError);
        alert("Account created but database save failed");
      }

      console.log("🎉 SIGNUP COMPLETE");

      alert("Account created successfully!");

      // reset form
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        province: "",
        qualification: "",
      });

    } catch (error) {
      console.error("❌ SIGNUP FAILED:", error);

      if (error.code === "auth/email-already-in-use") {
        alert("This email is already registered");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email format");
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
        <legend>Personal details</legend>

        <p className="field-row">
          <label>
            First name
            <input
              type="text"
              value={form.firstName}
              onChange={set("firstName")}
              required
            />
          </label>

          <label>
            Last name
            <input
              type="text"
              value={form.lastName}
              onChange={set("lastName")}
              required
            />
          </label>
        </p>

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
          Province
          <select value={form.province} onChange={set("province")} required>
            <option value="">Select province</option>
            {PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>

        <label>
          Highest qualification
          <select value={form.qualification} onChange={set("qualification")} required>
            <option value="">Select NQF level</option>
            {NQF_LEVELS.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </fieldset>

      <button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}