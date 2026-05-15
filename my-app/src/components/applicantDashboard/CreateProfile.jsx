import React, { useState } from "react";
import { db, auth } from "../../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import "./ApplicantProfile.css";

const supabase = createClient(
  "https://mmimkmmmpctwqhoxhvij.supabase.co",
  "sb_publishable_TDVvjNdOlW0a_SfxqPqyZg__W9X0Cpq"
);

const uploadCvToSupabase = async (file, userId) => {
  const fileName = `${userId}_${Date.now()}.pdf`;
  const { data, error } = await supabase.storage
    .from("cvs")
    .upload(fileName, file, { contentType: "application/pdf", upsert: true });
  if (error) throw new Error(error.message);
  const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(fileName);
  return urlData.publicUrl;
};

export default function CreateProfile() {
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    education: "",
    skills: "",
    interests: "",
    cv: null,
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
    // Clear error on change
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!profile.name.trim())
      newErrors.name = "Full name is required.";

    if (!profile.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^0\d{9}$/.test(profile.phone.trim())) {
      newErrors.phone = "Phone must be a valid 10-digit SA number starting with 0.";
    }

    if (!profile.education.trim())
      newErrors.education = "Education is required.";

    if (!profile.skills.trim())
      newErrors.skills = "Skills are required.";

    if (!profile.cv)
      newErrors.cv = "CV is required.";

    return newErrors;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) { alert("User not logged in"); return; }

      let cvUrl = null;
      if (profile.cv) {
        cvUrl = await uploadCvToSupabase(profile.cv, user.uid);
      }

      await setDoc(
        doc(db, "applicants", user.uid),
        {
          name: profile.name,
          phone: profile.phone,
          education: profile.education,
          skills: profile.skills,
          interests: profile.interests,
          cvUrl,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      alert("Profile saved successfully!");
      navigate("/dashboard/applicant");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    }
  };

  return (
    <section className="page">
      <form onSubmit={handleSave} className="profile-card">
        <h1 className="title">Create Profile</h1>

        <fieldset className="group">
          <legend>Personal Details</legend>
          <input
            name="name"
            placeholder="Full Name *"
            onChange={handleChange}
            className="input"
          />
          {errors.name && <p className="error">{errors.name}</p>}

          <input
            name="phone"
            placeholder="Phone Number * (e.g. 0821234567)"
            onChange={handleChange}
            className="input"
            maxLength={10}
          />
          {errors.phone && <p className="error">{errors.phone}</p>}
        </fieldset>

        <fieldset className="group">
          <legend>Education *</legend>
          <textarea name="education" onChange={handleChange} className="textarea" />
          {errors.education && <p className="error">{errors.education}</p>}
        </fieldset>

        <fieldset className="group">
          <legend>Skills *</legend>
          <textarea name="skills" onChange={handleChange} className="textarea" />
          {errors.skills && <p className="error">{errors.skills}</p>}
        </fieldset>

        <fieldset className="group">
          <legend>Interests</legend>
          <textarea name="interests" onChange={handleChange} className="textarea" />
        </fieldset>

        <fieldset className="group">
          <legend>Upload CV (PDF) *</legend>
          <input
            type="file"
            name="cv"
            accept=".pdf"
            onChange={handleChange}
            className="file"
          />
          {errors.cv && <p className="error">{errors.cv}</p>}
        </fieldset>

        <button type="submit" className="button">Save Profile</button>
      </form>
    </section>
  );
}