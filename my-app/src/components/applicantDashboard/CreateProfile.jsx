import React, { useState } from "react";
import { db, auth } from "../../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
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

const uploadCvToSupabase = async (file, userId) => {
  const fileName = `${userId}_${Date.now()}.pdf`;

  const { error } = await supabase.storage
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

    // Broad NQF/profile choices
    qualification: "",
    sector: "",

    // Specific SAQA qualification choice
    saqaQualificationId: "",
    qualificationTitle: "",
    customQualificationTitle: "",
    qualificationSource: "",
    qualificationSourceUrl: "",

    // Derived automatically from the selected SAQA qualification
    learningSubfield: "",
    saqaLearningArea: "",

    // User-facing practical skills
    skills: [],
    skillInput: "",
    skillsNotes: "",

    interests: "",
    cv: null,
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const clearErrors = (...fieldNames) => {
    setErrors((prev) => {
      const updated = { ...prev };

      fieldNames.forEach((fieldName) => {
        updated[fieldName] = "";
      });

      return updated;
    });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const addSkill = () => {
    const newSkills = splitSkillInput(profile.skillInput);

    if (newSkills.length === 0) return;

    setProfile((prev) => {
      const existingNormalizedSkills = new Set(
        prev.skills.map((skill) => normalizeSkill(skill)),
      );

      const uniqueNewSkills = newSkills.filter((skill) => {
        const normalized = normalizeSkill(skill);
        return normalized && !existingNormalizedSkills.has(normalized);
      });

      return {
        ...prev,
        skills: [...prev.skills, ...uniqueNewSkills],
        skillInput: "",
      };
    });

    clearErrors("skills");
  };

  const removeSkill = (skillToRemove) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
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

    clearErrors(
      "qualification",
      "saqaQualificationId",
      "customQualificationTitle",
    );
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

    clearErrors("sector", "saqaQualificationId", "customQualificationTitle");
  };

  const handleSaqaQualificationChange = (e) => {
    const data = e.target.dataset;
    const isOther = data.isOther === "true";

    setProfile((prev) => ({
      ...prev,
      saqaQualificationId: e.target.value,
      qualificationTitle: data.title || "",
      customQualificationTitle: isOther ? prev.customQualificationTitle : "",
      qualificationSource: isOther ? "User entered" : "SAQA",
      qualificationSourceUrl: data.sourceUrl || "",

      // SAQA alignment is derived automatically from the selected qualification.
      learningSubfield: data.learningSubfield || "",
      saqaLearningArea: data.learningSubfield || "",
    }));

    clearErrors("saqaQualificationId", "customQualificationTitle");
  };

  const validate = () => {
    const newErrors = {};

    if (!profile.name.trim()) newErrors.name = "Full name is required.";

    if (!profile.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^0\d{9}$/.test(profile.phone.trim())) {
      newErrors.phone =
        "Phone must be a valid 10-digit SA number starting with 0.";
    }

    if (!profile.education.trim()) {
      newErrors.education = "Education is required.";
    }

    if (!profile.qualification) {
      newErrors.qualification = "NQF level / qualification type is required.";
    }

    if (!profile.sector) {
      newErrors.sector = "Sector is required.";
    }

    if (!profile.saqaQualificationId) {
      newErrors.saqaQualificationId =
        "Specific qualification is required. Choose a SAQA option or Other / Not listed.";
    }

    if (
      profile.saqaQualificationId === OTHER_QUALIFICATION_VALUE &&
      !profile.customQualificationTitle.trim()
    ) {
      newErrors.customQualificationTitle =
        "Please enter your qualification title.";
    }

    if (profile.skills.length === 0) {
      newErrors.skills = "Add at least one practical skill.";
    }

    if (!profile.cv) {
      newErrors.cv = "CV is required.";
    }

    return newErrors;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("User not logged in");
      return;
    }

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      let cvUrl = null;

      if (profile.cv) {
        cvUrl = await uploadCvToSupabase(profile.cv, user.uid);
      }

      const finalQualificationTitle =
        profile.saqaQualificationId === OTHER_QUALIFICATION_VALUE
          ? profile.customQualificationTitle
          : profile.qualificationTitle;

      const normalizedSkills = profile.skills.map((skill) =>
        normalizeSkill(skill),
      );

      await setDoc(
        doc(db, "applicants", user.uid),
        {
          applicantId: user.uid,
          name: profile.name,
          phone: profile.phone,

          education: profile.education,
          interests: profile.interests,

          // Structured practical skills for matching
          skills: profile.skills,
          normalizedSkills,
          skillsText: profile.skills.join(", "),
          skillsNotes: profile.skillsNotes,

          qualification: profile.qualification,
          sector: profile.sector,
          saqaQualificationId:
            profile.saqaQualificationId === OTHER_QUALIFICATION_VALUE
              ? null
              : profile.saqaQualificationId,
          qualificationTitle: finalQualificationTitle,
          qualificationSource: profile.qualificationSource,
          qualificationSourceUrl: profile.qualificationSourceUrl,

          // Derived SAQA alignment, not manually selected by applicant.
          learningSubfield: profile.learningSubfield,
          saqaLearningArea: profile.saqaLearningArea,

          cvUrl,
          createdAt: serverTimestamp(),
        },
        { merge: true },
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
            value={profile.name}
            onChange={handleChange}
            className="input"
          />
          {errors.name && <p className="error">{errors.name}</p>}

          <input
            name="phone"
            placeholder="Phone Number * (e.g. 0821234567)"
            value={profile.phone}
            onChange={handleChange}
            className="input"
            maxLength={10}
          />
          {errors.phone && <p className="error">{errors.phone}</p>}
        </fieldset>

        <fieldset className="group">
          <legend>Education *</legend>

          <textarea
            name="education"
            value={profile.education}
            onChange={handleChange}
            className="textarea"
            placeholder="Briefly describe your education background"
          />
          {errors.education && <p className="error">{errors.education}</p>}

          <label>NQF Level / Qualification Type *</label>
          <NqfDropdown
            value={profile.qualification}
            onChange={handleNqfChange}
            required
          />
          {errors.qualification && (
            <p className="error">{errors.qualification}</p>
          )}

          <label>Sector / SAQA Field *</label>
          <SectorDropdown
            value={profile.sector}
            onChange={handleSectorChange}
            required
          />
          {errors.sector && <p className="error">{errors.sector}</p>}

          <label>Specific Qualification *</label>
          <SaqaQualificationDropdown
            value={profile.saqaQualificationId}
            onChange={handleSaqaQualificationChange}
            selectedNqf={profile.qualification}
            selectedSector={profile.sector}
            required
          />
          {errors.saqaQualificationId && (
            <p className="error">{errors.saqaQualificationId}</p>
          )}

          {profile.saqaQualificationId === OTHER_QUALIFICATION_VALUE && (
            <>
              <label>Enter qualification title *</label>
              <input
                type="text"
                name="customQualificationTitle"
                value={profile.customQualificationTitle}
                onChange={(e) => {
                  handleChange(e);

                  setProfile((prev) => ({
                    ...prev,
                    qualificationTitle: e.target.value,
                  }));
                }}
                className="input"
                placeholder="e.g. Master of Data Science"
              />
              {errors.customQualificationTitle && (
                <p className="error">{errors.customQualificationTitle}</p>
              )}
            </>
          )}

          {profile.saqaLearningArea && (
            <p className="helper-text">
              <strong>SAQA-aligned learning area:</strong>{" "}
              {profile.saqaLearningArea}
            </p>
          )}
        </fieldset>

        <fieldset className="group">
          <legend>Practical Skills *</legend>

          <label>Add one skill at a time</label>
          <div className="skill-input-row">
            <input
              type="text"
              name="skillInput"
              value={profile.skillInput}
              onChange={handleChange}
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

          {errors.skills && <p className="error">{errors.skills}</p>}

          {profile.skills.length > 0 && (
            <ul className="skill-chip-list" aria-label="Selected skills">
              {profile.skills.map((skill) => (
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
          )}

          <label>Additional skill notes</label>
          <textarea
            name="skillsNotes"
            value={profile.skillsNotes}
            onChange={handleChange}
            className="textarea"
            placeholder="Optional: Add context about where you used these skills"
          />

          <p className="helper-text">
            Skills are saved as individual items for better opportunity
            matching. SAQA alignment is derived from your selected
            qualification.
          </p>
        </fieldset>

        <fieldset className="group">
          <legend>Interests</legend>
          <textarea
            name="interests"
            value={profile.interests}
            onChange={handleChange}
            className="textarea"
          />
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

        <button type="submit" className="button">
          Save Profile
        </button>
      </form>
    </section>
  );
}
