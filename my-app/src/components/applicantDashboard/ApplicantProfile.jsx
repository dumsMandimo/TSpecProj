import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { getDoc, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { createClient } from "@supabase/supabase-js";
import "./ApplicantProfile.css";
import {
  NqfDropdown,
  SectorDropdown,
  SaqaQualificationDropdown,
  OTHER_QUALIFICATION_VALUE,
} from "../nqfSelect";

const supabase = createClient(
  "https://mmimkmmmpctwqhoxhvij.supabase.co",
  "sb_publishable_TDVvjNdOlW0a_SfxqPqyZg__W9X0Cpq",
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

function normalizeSkill(skill) {
  return String(skill || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function splitSkillInput(input) {
  return String(input || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function getSkillsArray(skills) {
  if (Array.isArray(skills)) return skills;

  if (typeof skills === "string" && skills.trim()) {
    return splitSkillInput(skills);
  }

  return [];
}

const uploadCvToSupabase = async (file, userId) => {
  const fileName = `${userId}_${Date.now()}.pdf`;

  const { error } = await supabase.storage
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

          const applicantData = applicantSnap.exists()
            ? applicantSnap.data()
            : {};
          const userData = userSnap.exists() ? userSnap.data() : {};
          const skillsArray = getSkillsArray(applicantData.skills);

          const isUserEnteredQualification =
            applicantData.qualificationSource === "User entered" &&
            applicantData.qualificationTitle;

          setProfile({
            id: user.uid,
            ...applicantData,
            skills: skillsArray,
            skillInput: "",
            skillsNotes: applicantData.skillsNotes || "",
            province: userData.province || applicantData.province || "",
            saqaQualificationId: isUserEnteredQualification
              ? OTHER_QUALIFICATION_VALUE
              : applicantData.saqaQualificationId || "",
            customQualificationTitle: isUserEnteredQualification
              ? applicantData.qualificationTitle
              : applicantData.customQualificationTitle || "",
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

  const addSkill = () => {
    const newSkills = splitSkillInput(profile.skillInput);

    if (newSkills.length === 0) return;

    setProfile((prev) => {
      const existingNormalizedSkills = new Set(
        getSkillsArray(prev.skills).map((skill) => normalizeSkill(skill)),
      );

      const uniqueNewSkills = newSkills.filter((skill) => {
        const normalized = normalizeSkill(skill);
        return normalized && !existingNormalizedSkills.has(normalized);
      });

      return {
        ...prev,
        skills: [...getSkillsArray(prev.skills), ...uniqueNewSkills],
        skillInput: "",
      };
    });
  };

  const removeSkill = (skillToRemove) => {
    setProfile((prev) => ({
      ...prev,
      skills: getSkillsArray(prev.skills).filter(
        (skill) => skill !== skillToRemove,
      ),
    }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleNqfChange = (e) => {
    setProfile((prev) => ({
      ...prev,
      qualification: e.target.value,
      saqaQualificationId: "",
      qualificationTitle: "",
      customQualificationTitle: "",
      qualificationSource: "",
      qualificationSourceUrl: "",
      learningSubfield: "",
      saqaLearningArea: "",
    }));
  };

  const handleSectorChange = (e) => {
    setProfile((prev) => ({
      ...prev,
      sector: e.target.value,
      saqaQualificationId: "",
      qualificationTitle: "",
      customQualificationTitle: "",
      qualificationSource: "",
      qualificationSourceUrl: "",
      learningSubfield: "",
      saqaLearningArea: "",
    }));
  };

  const handleSaqaQualificationChange = (e) => {
    const data = e.target.dataset;
    const isOther = data.isOther === "true";

    setProfile((prev) => ({
      ...prev,
      saqaQualificationId: e.target.value,
      qualificationTitle: data.title || "",
      customQualificationTitle: isOther
        ? prev.customQualificationTitle || ""
        : "",
      qualificationSource: isOther ? "User entered" : "SAQA",
      qualificationSourceUrl: data.sourceUrl || "",
      learningSubfield: data.learningSubfield || "",
      saqaLearningArea: data.learningSubfield || "",
    }));
  };

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

      const skills = getSkillsArray(profile.skills);
      const normalizedSkills = skills.map((skill) => normalizeSkill(skill));

      const isOtherQualification =
        profile.saqaQualificationId === OTHER_QUALIFICATION_VALUE;

      const finalQualificationTitle = isOtherQualification
        ? profile.customQualificationTitle || profile.qualificationTitle || ""
        : profile.qualificationTitle || "";

      if (!profile.qualification) {
        alert("Please select an NQF level / qualification type.");
        return;
      }

      if (!profile.sector) {
        alert("Please select a career interest sector.");
        return;
      }

      if (!profile.saqaQualificationId) {
        alert("Please select a specific qualification or Other / Not listed.");
        return;
      }

      if (isOtherQualification && !finalQualificationTitle.trim()) {
        alert("Please enter your qualification title.");
        return;
      }

      await updateDoc(doc(db, "applicants", user.uid), {
        name: profile.name,
        phone: profile.phone,
        education: profile.education,
        interests: profile.interests,

        skills,
        normalizedSkills,
        skillsText: skills.join(", "),
        skillsNotes: profile.skillsNotes || "",

        qualification: profile.qualification || "",
        sector: profile.sector || "",
        saqaQualificationId: isOtherQualification
          ? null
          : profile.saqaQualificationId,
        qualificationTitle: finalQualificationTitle,
        qualificationSource: isOtherQualification
          ? "User entered"
          : profile.qualificationSource || "SAQA",
        qualificationSourceUrl: isOtherQualification
          ? ""
          : profile.qualificationSourceUrl || "",
        learningSubfield: isOtherQualification
          ? ""
          : profile.learningSubfield || "",
        saqaLearningArea: isOtherQualification
          ? ""
          : profile.saqaLearningArea || "",

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

  const skills = getSkillsArray(profile.skills);

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

          <label>Education Summary</label>
          <textarea
            value={profile.education || ""}
            onChange={(e) =>
              setProfile({ ...profile, education: e.target.value })
            }
            className="textarea"
          />

          <label>Province</label>
          <select
            value={profile.province || ""}
            onChange={(e) =>
              setProfile({ ...profile, province: e.target.value })
            }
            className="input"
          >
            <option value="">Select province</option>
            {PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>

          <fieldset className="group">
            <legend>Qualification Details</legend>

            <label>NQF Level / Qualification Type</label>
            <NqfDropdown
              value={profile.qualification || ""}
              onChange={handleNqfChange}
              required
            />

            <label>Career Interest Sector</label>
            <SectorDropdown
              value={profile.sector || ""}
              onChange={handleSectorChange}
              required
            />

            <label>Specific Qualification</label>
            <SaqaQualificationDropdown
              value={profile.saqaQualificationId || ""}
              onChange={handleSaqaQualificationChange}
              selectedNqf={profile.qualification}
              selectedSector={profile.sector}
              required
            />

            {profile.saqaQualificationId === OTHER_QUALIFICATION_VALUE && (
              <>
                <label>Enter qualification title</label>
                <input
                  type="text"
                  value={profile.customQualificationTitle || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      customQualificationTitle: e.target.value,
                      qualificationTitle: e.target.value,
                    })
                  }
                  className="input"
                  placeholder="e.g. National Senior Certificate / Matric"
                />
              </>
            )}

            {(profile.saqaLearningArea || profile.learningSubfield) && (
              <p className="helper-text">
                <strong>SAQA-aligned learning area:</strong>{" "}
                {profile.saqaLearningArea || profile.learningSubfield}
              </p>
            )}
          </fieldset>

          <label>Practical Skills</label>
          <div className="skill-input-row">
            <input
              type="text"
              value={profile.skillInput || ""}
              onChange={(e) =>
                setProfile({ ...profile, skillInput: e.target.value })
              }
              onKeyDown={handleSkillKeyDown}
              className="input"
              placeholder="e.g. Excel, Java, bookkeeping"
            />
            <button
              type="button"
              className="button secondary"
              onClick={addSkill}
            >
              Add
            </button>
          </div>

          {skills.length > 0 ? (
            <ul className="skill-chip-list" aria-label="Selected skills">
              {skills.map((skill) => (
                <li key={normalizeSkill(skill)} className="skill-chip">
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="helper-text">No practical skills added yet.</p>
          )}

          <label>Additional Skill Notes</label>
          <textarea
            value={profile.skillsNotes || ""}
            onChange={(e) =>
              setProfile({ ...profile, skillsNotes: e.target.value })
            }
            className="textarea"
            placeholder="Optional: Add context about where you used these skills"
          />

          <label>Interests</label>
          <textarea
            value={profile.interests || ""}
            onChange={(e) =>
              setProfile({ ...profile, interests: e.target.value })
            }
            className="textarea"
          />

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

          <p>
            <strong>Name:</strong> {profile.name || "—"}
          </p>
          <p>
            <strong>Phone:</strong> {profile.phone || "—"}
          </p>
          <p>
            <strong>Province:</strong> {profile.province || "—"}
          </p>

          <hr className="profile-divider" />

          <p>
            <strong>Education Summary:</strong> {profile.education || "—"}
          </p>
          <p>
            <strong>NQF / Qualification Type:</strong>{" "}
            {profile.qualification || "—"}
          </p>
          <p>
            <strong>Specific Qualification:</strong>{" "}
            {profile.qualificationTitle || "—"}
          </p>
          <p>
            <strong>Qualification Source:</strong>{" "}
            {profile.qualificationSource || "—"}
          </p>

          {profile.qualificationSourceUrl && (
            <p>
              <strong>SAQA Source:</strong>{" "}
              <a
                href={profile.qualificationSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View qualification source
              </a>
            </p>
          )}

          <p>
            <strong>Career Interest Sector:</strong> {profile.sector || "—"}
          </p>
          <p>
            <strong>SAQA-aligned Learning Area:</strong>{" "}
            {profile.saqaLearningArea || profile.learningSubfield || "—"}
          </p>

          <hr className="profile-divider" />

          <p>
            <strong>Practical Skills:</strong>
          </p>
          {skills.length > 0 ? (
            <ul className="skill-chip-list" aria-label="Practical skills">
              {skills.map((skill) => (
                <li key={normalizeSkill(skill)} className="skill-chip">
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>—</p>
          )}

          {profile.skillsNotes && (
            <p>
              <strong>Skill Notes:</strong> {profile.skillsNotes}
            </p>
          )}

          <p>
            <strong>Interests:</strong> {profile.interests || "—"}
          </p>

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
