import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { getDoc, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { createClient } from "@supabase/supabase-js";
import "./ApplicantProfile.css";

const supabase = createClient(
  "https://mmimkmmmpctwqhoxhvij.supabase.co",
  "sb_publishable_TDVvjNdOlW0a_SfxqPqyZg__W9X0Cpq"
);

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

const uploadCvToSupabase = async (file, userId) => {
  const fileName = `${userId}_${Date.now()}.pdf`;
  const { data, error } = await supabase.storage
    .from("cvs")
    .upload(fileName, file, { contentType: "application/pdf", upsert: true });
  if (error) throw new Error(error.message);
  const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(fileName);
  return urlData.publicUrl;
};

export default function ApplicantProfile() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newCv, setNewCv] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const [applicantSnap, userSnap] = await Promise.all([
            getDoc(doc(db, "applicants", user.uid)),
            getDoc(doc(db, "users", user.uid)),
          ]);

          const applicantData = applicantSnap.exists() ? applicantSnap.data() : {};
          const userData = userSnap.exists() ? userSnap.data() : {};

          setProfile({
            id: user.uid,
            ...applicantData,
            province: userData.province || applicantData.province || "",
          });
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      } else {
        console.error("No user logged in");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUpdate = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        console.error("No user logged in");
        return;
      }

      let cvUrl = profile.cvUrl;
      if (newCv) {
        cvUrl = await uploadCvToSupabase(newCv, user.uid);
      }

      await updateDoc(doc(db, "applicants", user.uid), {
        name: profile.name,
        phone: profile.phone,
        education: profile.education,
        skills: profile.skills,
        interests: profile.interests,
        cvUrl,
      });

      await updateDoc(doc(db, "users", user.uid), {
        province: profile.province,
      });

      alert("Profile updated!");
      setEditMode(false);
      setNewCv(null);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile. Please try again.");
    }
  };

  if (!profile) return <p className="loading">Loading...</p>;

  return (
    <section className="page">
      <h1 className="title">My Profile</h1>

      {editMode ? (
        <fieldset className="profile-card">
          <legend>Edit Profile</legend>

          <label>Name</label>
          <input
            value={profile.name || ""}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="input"
          />

          <label>Phone</label>
          <input
            value={profile.phone || ""}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="input"
            maxLength={10}
          />

          <label>Education</label>
          <textarea
            value={profile.education || ""}
            onChange={(e) => setProfile({ ...profile, education: e.target.value })}
            className="textarea"
          />

          <label>Province</label>
          <select
            value={profile.province || ""}
            onChange={(e) => setProfile({ ...profile, province: e.target.value })}
            className="input"
          >
            <option value="">Select province</option>
            {PROVINCES.map((province, idx) => (
              <option key={idx} value={province}>
                {province}
              </option>
            ))}
          </select>

          <label>Skills</label>
          <textarea
            value={profile.skills || ""}
            onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
            className="textarea"
          />

          <label>Interests</label>
          <textarea
            value={profile.interests || ""}
            onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
            className="textarea"
          />

          {/* FIX: added htmlFor + matching id so getByLabelText works */}
          <label htmlFor="cv-upload">Update CV (PDF)</label>
          <input
            id="cv-upload"
            type="file"
            accept=".pdf"
            onChange={(e) => setNewCv(e.target.files[0])}
            className="input"
          />

          <button onClick={handleUpdate} className="button">
            Save Changes
          </button>
          <button
            onClick={() => setEditMode(false)}
            className="button"
            style={{ marginTop: "0.5rem", background: "#333", color: "#fff" }}
          >
            Cancel
          </button>
        </fieldset>
      ) : (
        <fieldset className="profile-card">
          <legend>Profile Details</legend>

          <p><strong>Name:</strong> {profile.name || "—"}</p>
          <p><strong>Phone:</strong> {profile.phone || "—"}</p>
          <p><strong>Education:</strong> {profile.education || "—"}</p>
          <p><strong>Province:</strong> {profile.province || "—"}</p>
          <p><strong>Skills:</strong> {profile.skills || "—"}</p>
          <p><strong>Interests:</strong> {profile.interests || "—"}</p>
          <p><strong>NQF Level:</strong> {profile.qualification || "—"}</p>

          {profile.cvUrl && (
            <p>
              <strong>CV:</strong>{" "}
              <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer">
                Download CV
              </a>
            </p>
          )}

          <button onClick={() => setEditMode(true)} className="button">
            Update Profile
          </button>
        </fieldset>
      )}
    </section>
  );
}
