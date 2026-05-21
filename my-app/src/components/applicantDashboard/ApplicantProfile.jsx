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

import { verifyQualificationAgainstSaqa } from "../../services/saqaVerificationService";

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

function createEducationId() {
  return `edu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyEducationEntry() {
  return {
    id: createEducationId(),
    qualification: "",
    sector: "",
    saqaQualificationId: "",
    qualificationTitle: "",
    customQualificationTitle: "",
    qualificationSource: "",
    qualificationSourceUrl: "",
    learningSubfield: "",
    saqaLearningArea: "",
    qualificationInputMode: "",
    saqaVerificationStatus: "not_checked",
    matchedSaqaQualificationId: null,
    matchedSaqaTitle: "",
    saqaMatchScore: 0,
    requiresReview: false,
  };
}

function normalizeEducationEntry(entry = {}) {
  const normalized = {
    ...createEmptyEducationEntry(),
    ...entry,
    id: entry.id || createEducationId(),
  };

  delete normalized.skills;
  return normalized;
}

function hasEducationContent(entry = {}) {
  return Boolean(
    entry.qualification ||
    entry.sector ||
    entry.saqaQualificationId ||
    entry.qualificationTitle ||
    entry.customQualificationTitle,
  );
}

function getQualificationTitleFromMatch(match) {
  return match?.title || match?.label || match?.qualification_title || "";
}

function getQualificationNqfLevelFromMatch(match) {
  return match?.nqf_level_number || match?.nqfLevel || "";
}

function buildEducationHistory(applicantData = {}) {
  if (
    Array.isArray(applicantData.educationHistory) &&
    applicantData.educationHistory.length > 0
  ) {
    return applicantData.educationHistory.map(normalizeEducationEntry);
  }

  const isUserEnteredQualification =
    applicantData.qualificationSource === "User entered" &&
    applicantData.qualificationTitle;

  const legacyEntry = normalizeEducationEntry({
    id: "primary_education",
    qualification: applicantData.qualification || "",
    sector: applicantData.sector || "",
    saqaQualificationId: isUserEnteredQualification
      ? OTHER_QUALIFICATION_VALUE
      : applicantData.saqaQualificationId || "",
    qualificationTitle: applicantData.qualificationTitle || "",
    customQualificationTitle: isUserEnteredQualification
      ? applicantData.qualificationTitle
      : applicantData.customQualificationTitle || "",
    qualificationSource: applicantData.qualificationSource || "",
    qualificationSourceUrl: applicantData.qualificationSourceUrl || "",
    learningSubfield: applicantData.learningSubfield || "",
    saqaLearningArea: applicantData.saqaLearningArea || "",
    qualificationInputMode: isUserEnteredQualification
      ? "custom"
      : applicantData.qualificationInputMode || "saqa",
    saqaVerificationStatus:
      applicantData.saqaVerificationStatus ||
      (isUserEnteredQualification ? "not_checked" : "matched"),
    matchedSaqaQualificationId:
      applicantData.matchedSaqaQualificationId ||
      applicantData.saqaQualificationId ||
      null,
    matchedSaqaTitle:
      applicantData.matchedSaqaTitle || applicantData.qualificationTitle || "",
    saqaMatchScore: applicantData.saqaMatchScore || 0,
    requiresReview: applicantData.requiresReview ?? isUserEnteredQualification,
  });

  return hasEducationContent(legacyEntry)
    ? [legacyEntry]
    : [createEmptyEducationEntry()];
}

function prepareEducationHistoryForSave(educationHistory = []) {
  return educationHistory
    .map(normalizeEducationEntry)
    .filter(hasEducationContent)
    .map((entry) => {
      const isOtherQualification =
        entry.saqaQualificationId === OTHER_QUALIFICATION_VALUE ||
        entry.qualificationInputMode === "custom";

      const finalQualificationTitle = isOtherQualification
        ? entry.customQualificationTitle || entry.qualificationTitle || ""
        : entry.qualificationTitle || "";

      return {
        id: entry.id,
        qualification: entry.qualification || "",
        sector: entry.sector || "",
        saqaQualificationId: isOtherQualification
          ? null
          : entry.saqaQualificationId || "",
        qualificationTitle: finalQualificationTitle,
        customQualificationTitle: isOtherQualification
          ? entry.customQualificationTitle || finalQualificationTitle || ""
          : "",
        qualificationSource: isOtherQualification
          ? "User entered"
          : entry.qualificationSource || "SAQA",
        qualificationSourceUrl: isOtherQualification
          ? ""
          : entry.qualificationSourceUrl || "",
        learningSubfield: isOtherQualification
          ? ""
          : entry.learningSubfield || "",
        saqaLearningArea: isOtherQualification
          ? ""
          : entry.saqaLearningArea || "",
        qualificationInputMode: entry.qualificationInputMode || "",
        saqaVerificationStatus:
          entry.saqaVerificationStatus ||
          (isOtherQualification ? "not_checked" : "matched"),
        matchedSaqaQualificationId:
          entry.matchedSaqaQualificationId ||
          (isOtherQualification ? null : entry.saqaQualificationId || null),
        matchedSaqaTitle:
          entry.matchedSaqaTitle || finalQualificationTitle || "",
        saqaMatchScore: entry.saqaMatchScore || 0,
        requiresReview: Boolean(entry.requiresReview),
      };
    });
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
  const [saqaChecks, setSaqaChecks] = useState({});
  const [checkingSaqaById, setCheckingSaqaById] = useState({});

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
          const educationHistory = buildEducationHistory(applicantData);
          const primaryEducation =
            educationHistory.find(hasEducationContent) || educationHistory[0];

          setProfile({
            id: user.uid,
            ...applicantData,
            skills: skillsArray,
            skillInput: "",
            skillsNotes: applicantData.skillsNotes || "",
            province: userData.province || applicantData.province || "",
            educationHistory,
            primaryEducationId:
              applicantData.primaryEducationId ||
              primaryEducation?.id ||
              educationHistory[0]?.id ||
              "",

            // Legacy fields kept for backwards compatibility with existing matching/listing code.
            qualification:
              primaryEducation?.qualification ||
              applicantData.qualification ||
              "",
            sector: primaryEducation?.sector || applicantData.sector || "",
            saqaQualificationId:
              primaryEducation?.saqaQualificationId ||
              applicantData.saqaQualificationId ||
              "",
            qualificationTitle:
              primaryEducation?.qualificationTitle ||
              applicantData.qualificationTitle ||
              "",
            customQualificationTitle:
              primaryEducation?.customQualificationTitle ||
              applicantData.customQualificationTitle ||
              "",
            qualificationSource:
              primaryEducation?.qualificationSource ||
              applicantData.qualificationSource ||
              "",
            qualificationSourceUrl:
              primaryEducation?.qualificationSourceUrl ||
              applicantData.qualificationSourceUrl ||
              "",
            learningSubfield:
              primaryEducation?.learningSubfield ||
              applicantData.learningSubfield ||
              "",
            saqaLearningArea:
              primaryEducation?.saqaLearningArea ||
              applicantData.saqaLearningArea ||
              "",
            qualificationInputMode:
              primaryEducation?.qualificationInputMode ||
              applicantData.qualificationInputMode ||
              "",
            saqaVerificationStatus:
              primaryEducation?.saqaVerificationStatus ||
              applicantData.saqaVerificationStatus ||
              "",
            matchedSaqaQualificationId:
              primaryEducation?.matchedSaqaQualificationId ||
              applicantData.matchedSaqaQualificationId ||
              null,
            matchedSaqaTitle:
              primaryEducation?.matchedSaqaTitle ||
              applicantData.matchedSaqaTitle ||
              "",
            saqaMatchScore:
              primaryEducation?.saqaMatchScore ||
              applicantData.saqaMatchScore ||
              0,
            requiresReview:
              primaryEducation?.requiresReview ||
              applicantData.requiresReview ||
              false,
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

  const updateEducationEntry = (entryId, patch) => {
    setProfile((prev) => ({
      ...prev,
      educationHistory: prev.educationHistory.map((entry) =>
        entry.id === entryId ? { ...entry, ...patch } : entry,
      ),
    }));
  };

  const clearSaqaCheck = (entryId) => {
    setSaqaChecks((prev) => {
      const copy = { ...prev };
      delete copy[entryId];
      return copy;
    });
  };

  const addEducationEntry = () => {
    setProfile((prev) => ({
      ...prev,
      educationHistory: [
        ...(prev.educationHistory || []),
        createEmptyEducationEntry(),
      ],
    }));
  };

  const removeEducationEntry = (entryId) => {
    setProfile((prev) => {
      const remaining = (prev.educationHistory || []).filter(
        (entry) => entry.id !== entryId,
      );

      return {
        ...prev,
        educationHistory:
          remaining.length > 0 ? remaining : [createEmptyEducationEntry()],
        primaryEducationId:
          prev.primaryEducationId === entryId
            ? remaining[0]?.id || ""
            : prev.primaryEducationId,
      };
    });

    clearSaqaCheck(entryId);
  };

  const handleEducationNqfChange = (entryId, e) => {
    clearSaqaCheck(entryId);

    updateEducationEntry(entryId, {
      qualification: e.target.value,
      saqaQualificationId: "",
      qualificationTitle: "",
      customQualificationTitle: "",
      qualificationSource: "",
      qualificationSourceUrl: "",
      learningSubfield: "",
      saqaLearningArea: "",
      qualificationInputMode: "",
      saqaVerificationStatus: "not_checked",
      matchedSaqaQualificationId: null,
      matchedSaqaTitle: "",
      saqaMatchScore: 0,
      requiresReview: false,
    });
  };

  const handleEducationSectorChange = (entryId, e) => {
    clearSaqaCheck(entryId);

    updateEducationEntry(entryId, {
      sector: e.target.value,
      saqaQualificationId: "",
      qualificationTitle: "",
      customQualificationTitle: "",
      qualificationSource: "",
      qualificationSourceUrl: "",
      learningSubfield: "",
      saqaLearningArea: "",
      qualificationInputMode: "",
      saqaVerificationStatus: "not_checked",
      matchedSaqaQualificationId: null,
      matchedSaqaTitle: "",
      saqaMatchScore: 0,
      requiresReview: false,
    });
  };

  const handleEducationSaqaQualificationChange = (entryId, e) => {
    const data = e.target.dataset;
    const isOther = data.isOther === "true";

    clearSaqaCheck(entryId);

    updateEducationEntry(entryId, {
      saqaQualificationId: e.target.value,
      qualificationTitle: data.title || "",
      customQualificationTitle: "",
      qualificationSource: isOther ? "User entered" : "SAQA",
      qualificationSourceUrl: isOther ? "" : data.sourceUrl || "",
      learningSubfield: isOther ? "" : data.learningSubfield || "",
      saqaLearningArea: isOther ? "" : data.learningSubfield || "",
      qualificationInputMode: isOther ? "custom" : "saqa",
      saqaVerificationStatus: isOther ? "not_checked" : "matched",
      matchedSaqaQualificationId: isOther ? null : e.target.value,
      matchedSaqaTitle: isOther ? "" : data.title || "",
      saqaMatchScore: isOther ? 0 : 1,
      requiresReview: isOther,
    });
  };

  const handleCustomQualificationChange = (entryId, e) => {
    const value = e.target.value;

    clearSaqaCheck(entryId);

    updateEducationEntry(entryId, {
      customQualificationTitle: value,
      qualificationTitle: value,
      qualificationInputMode: "custom",
      qualificationSource: "User entered",
      saqaVerificationStatus: "not_checked",
      matchedSaqaQualificationId: null,
      matchedSaqaTitle: "",
      saqaMatchScore: 0,
      requiresReview: true,
    });
  };

  const handleCheckCustomQualification = async (entry) => {
    const customTitle = entry.customQualificationTitle || "";

    if (!customTitle.trim()) {
      alert("Please enter your qualification title first.");
      return;
    }

    setCheckingSaqaById((prev) => ({ ...prev, [entry.id]: true }));
    clearSaqaCheck(entry.id);

    try {
      const result = await verifyQualificationAgainstSaqa(customTitle, {
        selectedSector: entry.sector,
        selectedNqfLevel: entry.qualification,
      });

      setSaqaChecks((prev) => ({ ...prev, [entry.id]: result }));

      updateEducationEntry(entry.id, {
        saqaVerificationStatus: result.status,
        matchedSaqaQualificationId: result.bestMatch?.id || null,
        matchedSaqaTitle: getQualificationTitleFromMatch(result.bestMatch),
        saqaMatchScore: result.matchScore || 0,
        requiresReview:
          result.status === "not_found" || result.status === "error",
      });
    } catch (error) {
      console.error("SAQA qualification check failed:", error);

      const failedResult = {
        status: "error",
        bestMatch: null,
        matches: [],
        matchScore: 0,
      };

      setSaqaChecks((prev) => ({ ...prev, [entry.id]: failedResult }));

      updateEducationEntry(entry.id, {
        saqaVerificationStatus: "error",
        matchedSaqaQualificationId: null,
        matchedSaqaTitle: "",
        saqaMatchScore: 0,
        requiresReview: true,
      });
    } finally {
      setCheckingSaqaById((prev) => ({ ...prev, [entry.id]: false }));
    }
  };

  const useSaqaMatch = (entryId, match, result) => {
    const matchedTitle = getQualificationTitleFromMatch(match);

    updateEducationEntry(entryId, {
      saqaQualificationId: match.id,
      qualificationTitle: matchedTitle,
      customQualificationTitle: "",
      qualificationSource: "SAQA matched custom entry",
      qualificationSourceUrl: match.source_url || "",
      learningSubfield: match.learning_subfield || "",
      saqaLearningArea: match.learning_subfield || "",
      qualificationInputMode: "saqa_matched_custom",
      saqaVerificationStatus: "matched",
      matchedSaqaQualificationId: match.id,
      matchedSaqaTitle: matchedTitle,
      qualificationNqfLevel: String(
        getQualificationNqfLevelFromMatch(match) || "",
      ),
      qualificationFieldName: match.field_name || "",
      saqaMatchScore: result?.matchScore || match.matchScore || 0,
      requiresReview: false,
    });

    clearSaqaCheck(entryId);
  };

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
      const educationHistory = prepareEducationHistoryForSave(
        profile.educationHistory,
      );

      if (educationHistory.length === 0) {
        alert("Please add at least one education background.");
        return;
      }

      for (const education of educationHistory) {
        if (!education.qualification) {
          alert(
            "Please select an NQF level / qualification type for each education background.",
          );
          return;
        }

        if (!education.sector) {
          alert("Please select a sector for each education background.");
          return;
        }

        if (
          !education.saqaQualificationId &&
          education.qualificationInputMode !== "custom"
        ) {
          alert(
            "Please select a specific qualification or Other / Not listed for each education background.",
          );
          return;
        }

        if (
          education.qualificationInputMode === "custom" &&
          !education.qualificationTitle.trim()
        ) {
          alert("Please enter the custom qualification title.");
          return;
        }
      }

      const primaryEducation =
        educationHistory.find(
          (entry) => entry.id === profile.primaryEducationId,
        ) || educationHistory[0];

      await updateDoc(doc(db, "applicants", user.uid), {
        name: profile.name,
        phone: profile.phone,
        education: profile.education,
        interests: profile.interests,

        skills,
        normalizedSkills,
        skillsText: skills.join(", "),
        skillsNotes: profile.skillsNotes || "",

        educationHistory,
        primaryEducationId: primaryEducation.id,

        // Legacy fields kept so existing matching/dashboard code still works.
        qualification: primaryEducation.qualification || "",
        sector: primaryEducation.sector || "",
        saqaQualificationId: primaryEducation.saqaQualificationId || null,
        qualificationTitle: primaryEducation.qualificationTitle || "",
        qualificationSource: primaryEducation.qualificationSource || "",
        qualificationSourceUrl: primaryEducation.qualificationSourceUrl || "",
        learningSubfield: primaryEducation.learningSubfield || "",
        saqaLearningArea: primaryEducation.saqaLearningArea || "",
        qualificationInputMode: primaryEducation.qualificationInputMode || "",
        customQualificationTitle:
          primaryEducation.customQualificationTitle || "",
        saqaVerificationStatus:
          primaryEducation.saqaVerificationStatus || "not_checked",
        matchedSaqaQualificationId:
          primaryEducation.matchedSaqaQualificationId || null,
        matchedSaqaTitle: primaryEducation.matchedSaqaTitle || "",
        saqaMatchScore: primaryEducation.saqaMatchScore || 0,
        requiresReview: Boolean(primaryEducation.requiresReview),

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
  const educationHistory = profile.educationHistory || [];

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
            <legend>Education History</legend>

            {educationHistory.map((entry, index) => {
              const saqaCheck = saqaChecks[entry.id];
              const checkingSaqa = Boolean(checkingSaqaById[entry.id]);
              const bestMatchTitle = getQualificationTitleFromMatch(
                saqaCheck?.bestMatch,
              );

              return (
                <fieldset key={entry.id} className="group">
                  <legend>Education Background {index + 1}</legend>

                  <button
                    type="button"
                    className={`button secondary ${
                      profile.primaryEducationId === entry.id
                        ? "primary-selected"
                        : ""
                    }`}
                    onClick={() =>
                      setProfile((prev) => ({
                        ...prev,
                        primaryEducationId: entry.id,
                      }))
                    }
                  >
                    {profile.primaryEducationId === entry.id
                      ? "Primary education selected"
                      : "Use as primary education for matching"}
                  </button>

                  <label>NQF Level / Qualification Type</label>
                  <NqfDropdown
                    value={entry.qualification || ""}
                    onChange={(e) => handleEducationNqfChange(entry.id, e)}
                    required
                  />

                  <label>Career Interest Sector</label>
                  <SectorDropdown
                    value={entry.sector || ""}
                    onChange={(e) => handleEducationSectorChange(entry.id, e)}
                    required
                  />

                  <label>Specific Qualification</label>
                  <SaqaQualificationDropdown
                    value={entry.saqaQualificationId || ""}
                    onChange={(e) =>
                      handleEducationSaqaQualificationChange(entry.id, e)
                    }
                    selectedNqf={entry.qualification}
                    selectedSector={entry.sector}
                    required
                  />

                  {entry.saqaQualificationId === OTHER_QUALIFICATION_VALUE && (
                    <>
                      <label>Enter qualification title</label>
                      <input
                        type="text"
                        value={entry.customQualificationTitle || ""}
                        onChange={(e) =>
                          handleCustomQualificationChange(entry.id, e)
                        }
                        className="input"
                        placeholder="e.g. National Senior Certificate / Matric"
                      />

                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => handleCheckCustomQualification(entry)}
                        disabled={
                          checkingSaqa ||
                          !(entry.customQualificationTitle || "").trim()
                        }
                      >
                        {checkingSaqa
                          ? "Checking SAQA..."
                          : "Check against SAQA records"}
                      </button>

                      {saqaCheck?.status === "matched" && (
                        <div className="helper-text">
                          <p>
                            <strong>SAQA record match found:</strong>{" "}
                            {bestMatchTitle}
                          </p>
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() =>
                              useSaqaMatch(
                                entry.id,
                                saqaCheck.bestMatch,
                                saqaCheck,
                              )
                            }
                          >
                            Use this SAQA match
                          </button>
                        </div>
                      )}

                      {saqaCheck?.status === "possible_match" && (
                        <div className="helper-text">
                          <p>
                            <strong>Possible SAQA match:</strong>{" "}
                            {bestMatchTitle}
                          </p>
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() =>
                              useSaqaMatch(
                                entry.id,
                                saqaCheck.bestMatch,
                                saqaCheck,
                              )
                            }
                          >
                            Yes, use this SAQA match
                          </button>
                        </div>
                      )}

                      {saqaCheck?.status === "not_found" && (
                        <p className="helper-text">
                          No SAQA record match was found in the current dataset.
                          This qualification can still be saved as a custom
                          qualification for review.
                        </p>
                      )}

                      {saqaCheck?.status === "error" && (
                        <p className="helper-text">
                          Could not check SAQA records right now. This
                          qualification can still be saved as a custom
                          qualification for review.
                        </p>
                      )}
                    </>
                  )}

                  {(entry.saqaLearningArea || entry.learningSubfield) && (
                    <p className="helper-text">
                      <strong>SAQA-aligned learning area:</strong>{" "}
                      {entry.saqaLearningArea || entry.learningSubfield}
                    </p>
                  )}

                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => removeEducationEntry(entry.id)}
                    disabled={educationHistory.length === 1}
                  >
                    Remove this education background
                  </button>
                </fieldset>
              );
            })}

            <button
              type="button"
              className="button secondary"
              onClick={addEducationEntry}
            >
              + Add another education background
            </button>
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
            <strong>Education Backgrounds:</strong>
          </p>

          {educationHistory.filter(hasEducationContent).length > 0 ? (
            <ul className="skill-chip-list" aria-label="Education backgrounds">
              {educationHistory.filter(hasEducationContent).map((entry) => (
                <li key={entry.id} className="skill-chip">
                  <span>
                    {entry.qualificationTitle ||
                      entry.customQualificationTitle ||
                      "Unnamed qualification"}{" "}
                    {entry.qualification ? `— ${entry.qualification}` : ""}
                    {entry.saqaLearningArea || entry.learningSubfield
                      ? ` — ${entry.saqaLearningArea || entry.learningSubfield}`
                      : ""}
                    {profile.primaryEducationId === entry.id
                      ? " — Primary"
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>—</p>
          )}

          <p>
            <strong>Primary NQF / Qualification Type:</strong>{" "}
            {profile.qualification || "—"}
          </p>
          <p>
            <strong>Primary Specific Qualification:</strong>{" "}
            {profile.qualificationTitle || "—"}
          </p>
          <p>
            <strong>Primary Qualification Source:</strong>{" "}
            {profile.qualificationSource || "—"}
          </p>
          <p>
            <strong>SAQA Verification Status:</strong>{" "}
            {profile.saqaVerificationStatus || "—"}
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
