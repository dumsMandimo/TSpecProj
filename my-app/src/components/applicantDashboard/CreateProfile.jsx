import React, { useState } from "react";
import { db } from "../../firebase";
import { auth } from "../../firebase";
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
    .upload(fileName, file, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage
    .from("cvs")
    .getPublicUrl(fileName);

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

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const user = auth.currentUser;

      if (!user) {
        alert("User not logged in");
        return;
      }

      let cvUrl = null;

      if (profile.cv) {
        cvUrl = await uploadCvToSupabase(profile.cv, user.uid);
      }

      await setDoc(
        doc(db, "users", user.uid),
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
      <form onSubmit={handleSave} className="card">
        <h1 className="title">Create Profile</h1>

        <fieldset className="group">
          <legend>Personal Details</legend>
          <input name="name" placeholder="Full Name" onChange={handleChange} className="input" />
          <input name="phone" placeholder="Phone Number" onChange={handleChange} className="input" />
        </fieldset>

        <fieldset className="group">
          <legend>Education</legend>
          <textarea name="education" onChange={handleChange} className="textarea" />
        </fieldset>

        <fieldset className="group">
          <legend>Skills</legend>
          <textarea name="skills" onChange={handleChange} className="textarea" />
        </fieldset>

        <fieldset className="group">
          <legend>Interests</legend>
          <textarea name="interests" onChange={handleChange} className="textarea" />
        </fieldset>

        <fieldset className="group">
          <legend>Upload CV (PDF)</legend>
          <input
            type="file"
            name="cv"
            accept=".pdf"
            onChange={handleChange}
            className="file"
          />
        </fieldset>

        <button type="submit" className="button">Save Profile</button>
      </form>
    </section>
  );
}
