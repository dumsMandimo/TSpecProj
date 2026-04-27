import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { db } from "../services/firebase.js";
import { getDoc, doc } from "firebase/firestore";
import { useEffect } from "react";

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
  const [nqfLevel, setNqfLevels] = useState({});
  //React hook that lets components remember and store data that can change over time
  //const [value, setValue] = useState

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "nqfLevel", "0Na7Q5IzFg2oI24GiqS3");
      const querySnapshot = await getDoc(docRef);

      const nqf = querySnapshot.data();
      console.log(nqf);
      setNqfLevels(nqf); //setting a state to an object
    };

    fetchData();
  }, []);

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

        <label>
          Highest qualification
          <select
            value={form.qualification}
            onChange={set("qualification")}
            required
          >
            <option value="">Select NQF level</option>

            {Object.entries(nqfLevel).map(([key, value]) => {
              if (Array.isArray(value)) {
                return (
                  <optgroup key={key} label={key}>
                    {value.map((v) => (
                      <option key={`${key} - ${v}`} value={v}>
                        {v}
                      </option>
                    ))}
                  </optgroup>
                );
              }
              return (
                <option key={key} value={value}>
                  {key} - {value}
                </option>
              );
            })}
          </select>
        </label>
      </fieldset>

      <button type="submit">Create account</button>
    </form>
  );
}
