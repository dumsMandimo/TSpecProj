import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

const SECTORS = [
  "Agriculture","Construction","Education","Energy","Finance",
  "Healthcare","Hospitality","ICT","Manufacturing","Mining",
  "Public Service","Retail","Transport","Other",
];

const PROVINCES = [
  "Eastern Cape","Free State","Gauteng","KwaZulu-Natal",
  "Limpopo","Mpumalanga","Northern Cape","North West","Western Cape",
];

export default function SignupProvider() {
  const [form, setForm] = useState({
    organisationName: "",
    contactName: "",
    email: "",
    password: "",
    sector: "",
    province: "",
    description: "",
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

    // --------------------
    // VALIDATION FIRST
    // --------------------
    if (!form.organisationName.trim()) {
      alert("Organisation name is required");
      return;
    }

    if (!form.contactName.trim()) {
      alert("Contact person is required");
      return;
    }

    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    if (!password || password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    if (!form.sector) {
      alert("Please select a sector");
      return;
    }

    if (!form.province) {
      alert("Please select a province");
      return;
    }

    setLoading(true);

    try {
      // CREATE USER
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.toLowerCase(),
        password
      );

      // UPDATE DISPLAY NAME
      await updateProfile(userCredential.user, {
        displayName: form.organisationName,
      });

      // SAVE TO FIRESTORE
      await setDoc(doc(db, "users", userCredential.user.uid), {
        organisationName: form.organisationName,
        contactName: form.contactName,
        email,
        sector: form.sector,
        province: form.province,
        description: form.description,
        role: "provider",
        createdAt: new Date(),
      });

      alert("Provider account created successfully!");
      console.log("PROVIDER SUCCESS");

      // reset form
      setForm({
        organisationName: "",
        contactName: "",
        email: "",
        password: "",
        sector: "",
        province: "",
        description: "",
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
        <legend>Organisation details</legend>

        <label>
          Organisation name
          <input
            type="text"
            value={form.organisationName}
            onChange={set("organisationName")}
            required
          />
        </label>

        <label>
          Contact person
          <input
            type="text"
            value={form.contactName}
            onChange={set("contactName")}
            required
          />
        </label>

        <p className="field-row">
          <label>
            Sector
            <select value={form.sector} onChange={set("sector")} required>
              <option value="">Select sector</option>
              {SECTORS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
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
        </p>

        <label>
          Description
          <textarea
            value={form.description}
            onChange={set("description")}
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
      </fieldset>

      <button type="submit" disabled={loading}>
        {loading ? "Creating provider..." : "Register organisation"}
      </button>
    </form>
  );
}