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

export default function ApplicantProfile() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newCv, setNewCv] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            setProfile({
              id: docSnap.id,
              ...docSnap.data(),
            });
          } else {
            console.log("No profile found");
          }
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
      if (!profile.id) {
        console.error("Missing profile ID");
        return;
      }

      let cvUrl = profile.cvUrl;

      if (newCv) {
        const user = auth.currentUser;
        cvUrl = await uploadCvToSupabase(newCv, user.uid);
      }

      const user = auth.currentUser;
      const profileRef = doc(db, "users", user.uid);

      await updateDoc(profileRef, {
        name: profile.name,
        phone: profile.phone,
        education: profile.education,
        skills: profile.skills,
        interests: profile.interests,
        cvUrl: cvUrl,
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
        <fieldset className="card">
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
            {PROVINCES.map((level, idx) => (
              <option key={idx} value={level}>
                {level}
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

          <label>Update CV (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setNewCv(e.target.files[0])}
            className="input"
          />

          <button onClick={handleUpdate} className="button">
            Save Changes
          </button>
        </fieldset>
      ) : (
        <fieldset className="card">
          <legend>Profile Details</legend>

          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Phone:</strong> {profile.phone}</p>
          <p><strong>Education:</strong> {profile.education}</p>
          <p><strong>Province:</strong> {profile.province}</p>
          <p><strong>Skills:</strong> {profile.skills}</p>
          <p><strong>Interests:</strong> {profile.interests}</p>
          <p><strong>NQF Level:</strong> {profile.qualification}</p>

          {profile.cvUrl && (
            <p>
              <strong>CV:</strong>{" "}
              <a
                href={profile.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
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
