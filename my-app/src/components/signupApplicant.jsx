import { useNavigate } from "react-router-dom";
import { useState } from "react";
import NqfSelect from "../components/nqfSelect.jsx";

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

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/dashboard/applicant");
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Personal details</legend>

        <p className="field-row">
          <label>
            First name
            <input
              type="text"
              placeholder="Thabo"
              value={form.firstName}
              onChange={set("firstName")}
              required
            />
          </label>
          <label>
            Last name
            <input
              type="text"
              placeholder="Nkosi"
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
            placeholder="thabo@email.com"
            value={form.email}
            onChange={set("email")}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="Min. 8 characters"
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

        {/* split it into two. i want the name to be in grey */}

        <label>
          Highest qualification
          <select
            value={form.qualification}
            onChange={set("qualification")}
            required
          >
            <option value="">Select NQF level</option>
            <NqfSelect />
          </select>
        </label>
      </fieldset>

      <button type="submit">Create account</button>
    </form>
  );
}
