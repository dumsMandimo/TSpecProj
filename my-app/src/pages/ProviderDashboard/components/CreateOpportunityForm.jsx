import { useState } from "react";
import { createOpportunity } from "../../../services/providerService";
import { auth } from "../../../services/firebase";
import { verifyQualificationAgainstSaqa } from "../../../services/saqaVerificationService";
import "./CreateOpportunityForm.css";
import {
  NqfDropdown,
  SectorDropdown,
  SaqaQualificationDropdown,
  OTHER_QUALIFICATION_VALUE,
} from "../../../components/nqfSelect";

const today = new Date().toISOString().split("T")[0];

const EMPTY_QUALIFICATION_DRAFT = {
  saqaQualificationId: "",
  qualificationTitle: "",
  customQualificationTitle: "",
  qualificationSource: "",
  qualificationSourceUrl: "",
  learningSubfield: "",
  nqfLevel: "",
  fieldName: "",
  inputMode: "",
  saqaVerificationStatus: "not_checked",
  matchedSaqaQualificationId: null,
  matchedSaqaTitle: "",
  saqaMatchScore: 0,
  requiresReview: false,
};

const EMPTY_FORM = {
  title: "",
  location: "",
  stipend: "",
  description: "",
  type: "learnership",
  closingDate: "",

  sector: "",
  minimumNqfLevel: "",
  minimumNqfLabel: "",

  acceptableQualifications: [],
  qualificationDraft: EMPTY_QUALIFICATION_DRAFT,

  requiredSkills: [],
  requiredSkillInput: "",
  preferredSkills: [],
  preferredSkillInput: "",
};

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

function parseNqfLevel(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (!value) return "";

  const directNumber = Number(value);

  if (Number.isInteger(directNumber)) {
    return directNumber;
  }

  const match = String(value).match(/NQF\s*(?:Level\s*)?(\d+)/i);

  return match ? Number(match[1]) : "";
}

function getQualificationDisplayTitle(qualification) {
  return (
    qualification.qualificationTitle ||
    qualification.customQualificationTitle ||
    "Unnamed qualification"
  );
}

function getQualificationTitleFromMatch(match) {
  return match?.title || match?.label || match?.qualification_title || "";
}

function getQualificationNqfLevelFromMatch(match) {
  return match?.nqf_level_number || match?.nqfLevel || "";
}

function getQualificationLearningArea(qualification) {
  return (
    qualification.saqaLearningArea ||
    qualification.learningSubfield ||
    qualification.learning_subfield ||
    ""
  );
}

function getQualificationKey(qualification) {
  if (qualification.saqaQualificationId) {
    return `saqa-${qualification.saqaQualificationId}`;
  }

  return `custom-${normalizeSkill(
    qualification.customQualificationTitle || qualification.qualificationTitle,
  )}-${qualification.nqfLevel || ""}-${qualification.fieldName || ""}`;
}

function resetMatchingDrafts() {
  return {
    acceptableQualifications: [],
    qualificationDraft: EMPTY_QUALIFICATION_DRAFT,
  };
}

function buildAcceptableQualificationFromDraft(form) {
  const draft = form.qualificationDraft;
  const isOther = draft.saqaQualificationId === OTHER_QUALIFICATION_VALUE;
  const title = isOther
    ? draft.customQualificationTitle.trim()
    : draft.qualificationTitle.trim();

  if (!title) return null;

  return {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `qualification_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    saqaQualificationId: isOther ? null : draft.saqaQualificationId || null,
    qualificationTitle: title,
    customQualificationTitle: isOther
      ? draft.customQualificationTitle.trim()
      : "",
    qualificationSource: isOther
      ? "User entered"
      : draft.qualificationSource || "SAQA",
    qualificationSourceUrl: isOther ? "" : draft.qualificationSourceUrl || "",
    learningSubfield: isOther ? "" : draft.learningSubfield || "",
    saqaLearningArea: isOther
      ? ""
      : draft.saqaLearningArea || draft.learningSubfield || "",
    nqfLevel: Number(draft.nqfLevel || form.minimumNqfLevel) || null,
    fieldName: draft.fieldName || form.sector || "",
    inputMode: isOther ? "custom" : draft.inputMode || "saqa",
    saqaVerificationStatus:
      draft.saqaVerificationStatus || (isOther ? "not_checked" : "matched"),
    matchedSaqaQualificationId:
      draft.matchedSaqaQualificationId ||
      (isOther ? null : draft.saqaQualificationId),
    matchedSaqaTitle: draft.matchedSaqaTitle || title,
    saqaMatchScore: draft.saqaMatchScore || (isOther ? 0 : 1),
    requiresReview:
      draft.requiresReview ||
      isOther ||
      draft.saqaVerificationStatus === "not_found" ||
      draft.saqaVerificationStatus === "error",
  };
}

function getFirstAcceptableQualification(acceptableQualifications) {
  return acceptableQualifications.length > 0
    ? acceptableQualifications[0]
    : null;
}

export default function CreateOpportunityForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [qualificationSaqaCheck, setQualificationSaqaCheck] = useState(null);
  const [checkingQualificationSaqa, setCheckingQualificationSaqa] =
    useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSuccessMsg("");
  };

  const handleSectorChange = (e) => {
    setQualificationSaqaCheck(null);

    setForm((prev) => ({
      ...prev,
      sector: e.target.value,
      ...resetMatchingDrafts(),
    }));

    setErrors((prev) => ({ ...prev, sector: undefined }));
    setSuccessMsg("");
  };

  const handleMinimumNqfChange = (e) => {
    setQualificationSaqaCheck(null);

    const level = e.target.dataset?.nqfLevel || parseNqfLevel(e.target.value);

    setForm((prev) => ({
      ...prev,
      minimumNqfLevel: level ? String(level) : "",
      minimumNqfLabel: e.target.value,
      ...resetMatchingDrafts(),
    }));

    setErrors((prev) => ({ ...prev, minimumNqfLevel: undefined }));
    setSuccessMsg("");
  };

  const handleQualificationChange = (e) => {
    setQualificationSaqaCheck(null);

    const data = e.target.dataset;
    const selectedValue = e.target.value;
    const isOther = data.isOther === "true";

    if (!selectedValue) {
      setForm((prev) => ({
        ...prev,
        qualificationDraft: EMPTY_QUALIFICATION_DRAFT,
      }));
      setErrors((prev) => ({ ...prev, qualificationDraft: undefined }));
      return;
    }

    if (isOther) {
      setForm((prev) => ({
        ...prev,
        qualificationDraft: {
          saqaQualificationId: OTHER_QUALIFICATION_VALUE,
          qualificationTitle: "",
          customQualificationTitle: "",
          qualificationSource: "User entered",
          qualificationSourceUrl: "",
          learningSubfield: "",
          saqaLearningArea: "",
          nqfLevel: prev.minimumNqfLevel,
          fieldName: prev.sector,
          inputMode: "custom",
          saqaVerificationStatus: "not_checked",
          matchedSaqaQualificationId: null,
          matchedSaqaTitle: "",
          saqaMatchScore: 0,
          requiresReview: true,
        },
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      qualificationDraft: {
        saqaQualificationId: selectedValue,
        qualificationTitle: data.title || "",
        customQualificationTitle: "",
        qualificationSource: "SAQA",
        qualificationSourceUrl: data.sourceUrl || "",
        learningSubfield: data.learningSubfield || "",
        saqaLearningArea: data.learningSubfield || "",
        nqfLevel: data.nqfLevel || prev.minimumNqfLevel,
        fieldName: data.fieldName || prev.sector,
        inputMode: "saqa",
        saqaVerificationStatus: "matched",
        matchedSaqaQualificationId: selectedValue,
        matchedSaqaTitle: data.title || "",
        saqaMatchScore: 1,
        requiresReview: false,
      },
    }));

    setQualificationSaqaCheck(null);
    setErrors((prev) => ({ ...prev, qualificationDraft: undefined }));
    setSuccessMsg("");
  };

  const handleCustomQualificationChange = (e) => {
    const value = e.target.value;

    setQualificationSaqaCheck(null);

    setForm((prev) => ({
      ...prev,
      qualificationDraft: {
        ...prev.qualificationDraft,
        customQualificationTitle: value,
        qualificationTitle: value,
        qualificationSource: "User entered",
        inputMode: "custom",
        saqaVerificationStatus: "not_checked",
        matchedSaqaQualificationId: null,
        matchedSaqaTitle: "",
        saqaMatchScore: 0,
        requiresReview: true,
      },
    }));

    setErrors((prev) => ({ ...prev, qualificationDraft: undefined }));
    setSuccessMsg("");
  };

  const handleCheckQualificationAgainstSaqa = async () => {
    const customTitle = form.qualificationDraft.customQualificationTitle || "";

    if (!customTitle.trim()) {
      setErrors((prev) => ({
        ...prev,
        qualificationDraft:
          "Enter the qualification name before checking SAQA.",
      }));
      return;
    }

    setCheckingQualificationSaqa(true);
    setQualificationSaqaCheck(null);
    setErrors((prev) => ({ ...prev, qualificationDraft: undefined }));

    try {
      const result = await verifyQualificationAgainstSaqa(customTitle, {
        selectedSector: form.sector,
        selectedNqfLevel: form.minimumNqfLabel || form.minimumNqfLevel,
      });

      setQualificationSaqaCheck(result);

      setForm((prev) => ({
        ...prev,
        qualificationDraft: {
          ...prev.qualificationDraft,
          saqaVerificationStatus: result.status,
          matchedSaqaQualificationId: result.bestMatch?.id || null,
          matchedSaqaTitle: getQualificationTitleFromMatch(result.bestMatch),
          saqaMatchScore: result.matchScore || 0,
          requiresReview:
            result.status === "not_found" || result.status === "error",
        },
      }));
    } catch (error) {
      console.error("SAQA qualification check failed:", error);

      const failedResult = {
        status: "error",
        bestMatch: null,
        matches: [],
        matchScore: 0,
      };

      setQualificationSaqaCheck(failedResult);

      setForm((prev) => ({
        ...prev,
        qualificationDraft: {
          ...prev.qualificationDraft,
          saqaVerificationStatus: "error",
          matchedSaqaQualificationId: null,
          matchedSaqaTitle: "",
          saqaMatchScore: 0,
          requiresReview: true,
        },
      }));
    } finally {
      setCheckingQualificationSaqa(false);
    }
  };

  const useSaqaMatchForQualificationDraft = (
    match,
    result = qualificationSaqaCheck,
  ) => {
    const matchedTitle = getQualificationTitleFromMatch(match);
    const matchedNqfLevel =
      getQualificationNqfLevelFromMatch(match) || form.minimumNqfLevel;

    setForm((prev) => ({
      ...prev,
      qualificationDraft: {
        saqaQualificationId: match.id,
        qualificationTitle: matchedTitle,
        customQualificationTitle: "",
        qualificationSource: "SAQA matched custom entry",
        qualificationSourceUrl: match.source_url || "",
        learningSubfield: match.learning_subfield || "",
        saqaLearningArea: match.learning_subfield || "",
        nqfLevel: String(matchedNqfLevel || ""),
        fieldName: match.field_name || prev.sector,
        inputMode: "saqa_matched_custom",
        saqaVerificationStatus: "matched",
        matchedSaqaQualificationId: match.id,
        matchedSaqaTitle: matchedTitle,
        saqaMatchScore: result?.matchScore || match.matchScore || 0,
        requiresReview: false,
      },
    }));

    setQualificationSaqaCheck(null);
    setErrors((prev) => ({ ...prev, qualificationDraft: undefined }));
  };

  const addAcceptableQualification = () => {
    const qualification = buildAcceptableQualificationFromDraft(form);

    if (!qualification) {
      setErrors((prev) => ({
        ...prev,
        qualificationDraft:
          "Choose a SAQA qualification or enter a custom qualification first.",
      }));
      return;
    }

    const nextKey = getQualificationKey(qualification);

    setForm((prev) => {
      const alreadyExists = prev.acceptableQualifications.some(
        (existing) => getQualificationKey(existing) === nextKey,
      );

      if (alreadyExists) {
        return {
          ...prev,
          qualificationDraft: EMPTY_QUALIFICATION_DRAFT,
        };
      }

      return {
        ...prev,
        acceptableQualifications: [
          ...prev.acceptableQualifications,
          qualification,
        ],
        qualificationDraft: EMPTY_QUALIFICATION_DRAFT,
      };
    });

    setErrors((prev) => ({ ...prev, qualificationDraft: undefined }));
    setSuccessMsg("");
  };

  const removeAcceptableQualification = (qualificationId) => {
    setForm((prev) => ({
      ...prev,
      acceptableQualifications: prev.acceptableQualifications.filter(
        (qualification) => qualification.id !== qualificationId,
      ),
    }));
  };

  const addSkill = (fieldName, inputName, errorName) => {
    const newSkills = splitSkillInput(form[inputName]);

    if (newSkills.length === 0) return;

    setForm((prev) => {
      const existingNormalizedSkills = new Set(
        prev[fieldName].map((skill) => normalizeSkill(skill)),
      );

      const uniqueNewSkills = newSkills.filter((skill) => {
        const normalized = normalizeSkill(skill);
        return normalized && !existingNormalizedSkills.has(normalized);
      });

      return {
        ...prev,
        [fieldName]: [...prev[fieldName], ...uniqueNewSkills],
        [inputName]: "",
      };
    });

    setErrors((prev) => ({ ...prev, [errorName]: undefined }));
    setSuccessMsg("");
  };

  const removeSkill = (fieldName, skillToRemove) => {
    setForm((prev) => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSkillKeyDown = (e, fieldName, inputName, errorName) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(fieldName, inputName, errorName);
    }
  };

  const validate = () => {
    const next = {};

    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.location.trim()) next.location = "Location is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    if (!form.closingDate) next.closingDate = "Closing date is required.";

    if (!form.sector) {
      next.sector = "Sector is required for opportunity matching.";
    }

    if (!form.minimumNqfLevel) {
      next.minimumNqfLevel = "Minimum NQF level is required.";
    }

    if (
      form.qualificationDraft.saqaQualificationId ===
        OTHER_QUALIFICATION_VALUE &&
      !form.qualificationDraft.customQualificationTitle.trim()
    ) {
      next.qualificationDraft =
        "Enter the qualification name or add a SAQA option.";
    }

    if (form.requiredSkills.length === 0) {
      next.requiredSkills = "Add at least one required skill.";
    }

    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      const uid = auth.currentUser?.uid;

      const normalizedRequiredSkills = form.requiredSkills.map((skill) =>
        normalizeSkill(skill),
      );

      const normalizedPreferredSkills = form.preferredSkills.map((skill) =>
        normalizeSkill(skill),
      );

      const acceptableQualifications = form.acceptableQualifications.map(
        (qualification) => ({
          saqaQualificationId: qualification.saqaQualificationId || null,
          qualificationTitle: qualification.qualificationTitle || "",
          customQualificationTitle:
            qualification.customQualificationTitle || "",
          qualificationSource: qualification.qualificationSource || "",
          qualificationSourceUrl: qualification.qualificationSourceUrl || "",
          learningSubfield: qualification.learningSubfield || "",
          saqaLearningArea: qualification.saqaLearningArea || "",
          nqfLevel: qualification.nqfLevel || null,
          fieldName: qualification.fieldName || "",
          inputMode: qualification.inputMode || "",
          saqaVerificationStatus:
            qualification.saqaVerificationStatus || "not_checked",
          matchedSaqaQualificationId:
            qualification.matchedSaqaQualificationId || null,
          matchedSaqaTitle: qualification.matchedSaqaTitle || "",
          saqaMatchScore: qualification.saqaMatchScore || 0,
          requiresReview: Boolean(qualification.requiresReview),
        }),
      );

      const firstQualification = getFirstAcceptableQualification(
        acceptableQualifications,
      );

      await createOpportunity({
        title: form.title,
        location: form.location,
        stipend: form.stipend,
        description: form.description,
        type: form.type,
        closingDate: form.closingDate,

        sector: form.sector,
        minimumNqfLevel: Number(form.minimumNqfLevel),

        acceptableQualifications,
        acceptableQualificationTitles: acceptableQualifications.map(
          (qualification) => qualification.qualificationTitle,
        ),
        acceptableQualificationIds: acceptableQualifications
          .map((qualification) => qualification.saqaQualificationId)
          .filter(Boolean),

        // Legacy fields kept so existing applicant-dashboard matching still works.
        requiredQualificationId:
          firstQualification?.saqaQualificationId || null,
        requiredQualificationTitle:
          firstQualification?.qualificationTitle || "",
        requiredQualificationSource:
          firstQualification?.qualificationSource || "",
        requiredQualificationSourceUrl:
          firstQualification?.qualificationSourceUrl || "",
        requiredQualificationLearningSubfield:
          firstQualification?.learningSubfield || "",
        requiredQualificationNqfLevel:
          firstQualification?.nqfLevel || Number(form.minimumNqfLevel),
        requiredQualificationFieldName:
          firstQualification?.fieldName || form.sector,

        // One SAQA learning area is attached to each acceptable qualification.
        // This legacy field keeps existing displays/matching working by using the first acceptable qualification.
        preferredLearningArea:
          firstQualification?.saqaLearningArea ||
          firstQualification?.learningSubfield ||
          "",

        requiredSkills: form.requiredSkills,
        normalizedRequiredSkills,
        requiredSkillsText: form.requiredSkills.join(", "),

        preferredSkills: form.preferredSkills,
        normalizedPreferredSkills,
        preferredSkillsText: form.preferredSkills.join(", "),

        providerUid: uid,
        status: "pending",
      });

      setForm(EMPTY_FORM);
      setSuccessMsg("Opportunity posted successfully and is pending review.");
    } catch (err) {
      console.error("Create opportunity error:", err);
      setErrors({ submit: "Failed to post opportunity. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const qualificationDraft = form.qualificationDraft;
  const canChooseSaqaQualification = Boolean(
    form.sector && form.minimumNqfLevel,
  );

  return (
    <section aria-label="Post new opportunity">
      <header className="create-form__header">
        <h2 className="create-form__title">Post New Opportunity</h2>
        <p className="create-form__subtitle">
          Fill in the details below to post a learnership or internship.
        </p>
      </header>

      {successMsg && (
        <p className="create-form__success" role="status">
          {successMsg}
        </p>
      )}

      {errors.submit && (
        <p className="create-form__error" role="alert">
          {errors.submit}
        </p>
      )}

      <form className="create-form__form" onSubmit={handleSubmit} noValidate>
        <fieldset className="create-form__fieldset">
          <legend className="create-form__legend">Opportunity details</legend>

          <section className="create-form__row create-form__row--half">
            <label className="create-form__label" htmlFor="opp-title">
              Title <span aria-hidden="true">*</span>
            </label>
            <input
              id="opp-title"
              className={`create-form__input${
                errors.title ? " create-form__input--error" : ""
              }`}
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Software Development Learnership"
              aria-required="true"
              aria-describedby={errors.title ? "opp-title-err" : undefined}
            />
            {errors.title && (
              <p
                id="opp-title-err"
                className="create-form__field-error"
                role="alert"
              >
                {errors.title}
              </p>
            )}
          </section>

          <section className="create-form__row create-form__row--half">
            <label className="create-form__label" htmlFor="opp-type">
              Type
            </label>
            <select
              id="opp-type"
              className="create-form__select"
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option value="learnership">Learnership</option>
              <option value="internship">Internship</option>
              <option value="apprenticeship">Apprenticeship</option>
              <option value="graduate">Graduate Programme</option>
            </select>
          </section>

          <section className="create-form__row create-form__row--half">
            <label className="create-form__label" htmlFor="opp-location">
              Location <span aria-hidden="true">*</span>
            </label>
            <input
              id="opp-location"
              className={`create-form__input${
                errors.location ? " create-form__input--error" : ""
              }`}
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Johannesburg, Gauteng"
              aria-required="true"
              aria-describedby={
                errors.location ? "opp-location-err" : undefined
              }
            />
            {errors.location && (
              <p
                id="opp-location-err"
                className="create-form__field-error"
                role="alert"
              >
                {errors.location}
              </p>
            )}
          </section>

          <section className="create-form__row create-form__row--half">
            <label className="create-form__label" htmlFor="opp-stipend">
              Stipend (optional)
            </label>
            <input
              id="opp-stipend"
              className="create-form__input"
              type="text"
              name="stipend"
              value={form.stipend}
              onChange={handleChange}
              placeholder="e.g. R3 500/month"
            />
          </section>

          <section className="create-form__row create-form__row--half">
            <label className="create-form__label" htmlFor="opp-closing-date">
              Closing Date <span aria-hidden="true">*</span>
            </label>
            <input
              id="opp-closing-date"
              className={`create-form__input${
                errors.closingDate ? " create-form__input--error" : ""
              }`}
              type="date"
              name="closingDate"
              value={form.closingDate}
              onChange={handleChange}
              min={today}
              aria-required="true"
              aria-describedby={
                errors.closingDate ? "opp-closing-err" : undefined
              }
            />
            {errors.closingDate && (
              <p
                id="opp-closing-err"
                className="create-form__field-error"
                role="alert"
              >
                {errors.closingDate}
              </p>
            )}
          </section>

          <section className="create-form__row">
            <label className="create-form__label" htmlFor="opp-description">
              Description <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="opp-description"
              className={`create-form__textarea${
                errors.description ? " create-form__input--error" : ""
              }`}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe responsibilities, requirements, and duration..."
              rows={5}
              aria-required="true"
              aria-describedby={errors.description ? "opp-desc-err" : undefined}
            />
            {errors.description && (
              <p
                id="opp-desc-err"
                className="create-form__field-error"
                role="alert"
              >
                {errors.description}
              </p>
            )}
          </section>
        </fieldset>

        <fieldset className="create-form__fieldset">
          <legend className="create-form__legend">Matching requirements</legend>

          <section className="create-form__row create-form__row--half">
            <label className="create-form__label">
              Sector / SAQA Field <span aria-hidden="true">*</span>
            </label>
            <SectorDropdown
              value={form.sector}
              onChange={handleSectorChange}
              required
            />
            {errors.sector && (
              <p className="create-form__field-error" role="alert">
                {errors.sector}
              </p>
            )}
          </section>

          <section className="create-form__row create-form__row--half">
            <label className="create-form__label">
              Minimum NQF Level <span aria-hidden="true">*</span>
            </label>
            <NqfDropdown
              value={form.minimumNqfLabel}
              onChange={handleMinimumNqfChange}
              required
            />
            {errors.minimumNqfLevel && (
              <p className="create-form__field-error" role="alert">
                {errors.minimumNqfLevel}
              </p>
            )}
          </section>

          <section className="create-form__row">
            <label className="create-form__label">
              Acceptable Qualifications (optional)
            </label>

            {canChooseSaqaQualification ? (
              <>
                <SaqaQualificationDropdown
                  value={qualificationDraft.saqaQualificationId}
                  onChange={handleQualificationChange}
                  selectedNqf={form.minimumNqfLabel || form.minimumNqfLevel}
                  selectedSector={form.sector}
                  includeOther
                />

                {qualificationDraft.saqaQualificationId ===
                  OTHER_QUALIFICATION_VALUE && (
                  <section className="create-form__row">
                    <label
                      className="create-form__label"
                      htmlFor="opp-custom-qualification"
                    >
                      Enter qualification name
                    </label>
                    <input
                      id="opp-custom-qualification"
                      className={`create-form__input${
                        errors.qualificationDraft
                          ? " create-form__input--error"
                          : ""
                      }`}
                      type="text"
                      value={qualificationDraft.customQualificationTitle}
                      onChange={handleCustomQualificationChange}
                      placeholder="e.g. National Senior Certificate / Matric"
                      aria-describedby={
                        errors.qualificationDraft
                          ? "opp-custom-qualification-err"
                          : undefined
                      }
                    />
                  </section>
                )}

                {qualificationDraft.saqaQualificationId ===
                  OTHER_QUALIFICATION_VALUE && (
                  <>
                    <button
                      type="button"
                      className="create-form__secondary-btn"
                      onClick={handleCheckQualificationAgainstSaqa}
                      disabled={
                        checkingQualificationSaqa ||
                        !qualificationDraft.customQualificationTitle.trim()
                      }
                    >
                      {checkingQualificationSaqa
                        ? "Checking SAQA..."
                        : "Check against SAQA records"}
                    </button>

                    {qualificationSaqaCheck?.status === "matched" && (
                      <div className="create-form__helper">
                        <p>
                          <strong>SAQA record match found:</strong>{" "}
                          {getQualificationTitleFromMatch(
                            qualificationSaqaCheck.bestMatch,
                          )}
                        </p>
                        <button
                          type="button"
                          className="create-form__secondary-btn"
                          onClick={() =>
                            useSaqaMatchForQualificationDraft(
                              qualificationSaqaCheck.bestMatch,
                              qualificationSaqaCheck,
                            )
                          }
                        >
                          Use this SAQA match
                        </button>
                      </div>
                    )}

                    {qualificationSaqaCheck?.status === "possible_match" && (
                      <div className="create-form__helper">
                        <p>
                          <strong>Possible SAQA match:</strong>{" "}
                          {getQualificationTitleFromMatch(
                            qualificationSaqaCheck.bestMatch,
                          )}
                        </p>
                        <button
                          type="button"
                          className="create-form__secondary-btn"
                          onClick={() =>
                            useSaqaMatchForQualificationDraft(
                              qualificationSaqaCheck.bestMatch,
                              qualificationSaqaCheck,
                            )
                          }
                        >
                          Yes, use this SAQA match
                        </button>
                      </div>
                    )}

                    {qualificationSaqaCheck?.status === "not_found" && (
                      <p className="create-form__helper">
                        No SAQA record match was found in the current dataset.
                        This qualification can still be added as a custom
                        acceptable qualification for review.
                      </p>
                    )}

                    {qualificationSaqaCheck?.status === "error" && (
                      <p className="create-form__helper">
                        Could not check SAQA records right now. This
                        qualification can still be added as a custom acceptable
                        qualification for review.
                      </p>
                    )}
                  </>
                )}

                {getQualificationLearningArea(qualificationDraft) && (
                  <p className="create-form__helper">
                    <strong>SAQA-aligned learning area:</strong>{" "}
                    {getQualificationLearningArea(qualificationDraft)}
                  </p>
                )}

                <button
                  type="button"
                  className="create-form__secondary-btn"
                  onClick={addAcceptableQualification}
                >
                  Add acceptable qualification
                </button>
              </>
            ) : (
              <p className="create-form__helper">
                Select a sector and minimum NQF level before adding acceptable
                qualifications.
              </p>
            )}

            {errors.qualificationDraft && (
              <p
                id="opp-custom-qualification-err"
                className="create-form__field-error"
                role="alert"
              >
                {errors.qualificationDraft}
              </p>
            )}

            <p className="create-form__helper">
              Add more than one qualification if different SAQA-aligned
              qualifications can meet the opportunity criteria.
            </p>

            {form.acceptableQualifications.length > 0 && (
              <ul
                className="create-form__skill-chip-list"
                aria-label="Acceptable qualifications"
              >
                {form.acceptableQualifications.map((qualification) => (
                  <li key={qualification.id} className="create-form__chip">
                    <span>
                      {getQualificationDisplayTitle(qualification)}
                      {qualification.nqfLevel
                        ? ` — NQF ${qualification.nqfLevel}`
                        : ""}
                      {getQualificationLearningArea(qualification)
                        ? ` — ${getQualificationLearningArea(qualification)}`
                        : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        removeAcceptableQualification(qualification.id)
                      }
                      aria-label={`Remove ${getQualificationDisplayTitle(
                        qualification,
                      )}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="create-form__row">
            <p className="create-form__helper">
              SAQA learning areas are attached to each acceptable qualification
              automatically after you choose or add the qualification. Add
              another acceptable qualification if the opportunity can accept a
              different learning area.
            </p>
          </section>

          <section className="create-form__row">
            <label className="create-form__label" htmlFor="opp-required-skill">
              Required Skills <span aria-hidden="true">*</span>
            </label>
            <div className="create-form__skill-input-row">
              <input
                id="opp-required-skill"
                className="create-form__input"
                type="text"
                name="requiredSkillInput"
                value={form.requiredSkillInput}
                onChange={handleChange}
                onKeyDown={(e) =>
                  handleSkillKeyDown(
                    e,
                    "requiredSkills",
                    "requiredSkillInput",
                    "requiredSkills",
                  )
                }
                placeholder="e.g. Excel, Java, communication"
              />
              <button
                type="button"
                className="create-form__secondary-btn"
                onClick={() =>
                  addSkill(
                    "requiredSkills",
                    "requiredSkillInput",
                    "requiredSkills",
                  )
                }
              >
                Add
              </button>
            </div>
            {errors.requiredSkills && (
              <p className="create-form__field-error" role="alert">
                {errors.requiredSkills}
              </p>
            )}
            {form.requiredSkills.length > 0 && (
              <ul
                className="create-form__skill-chip-list"
                aria-label="Required skills"
              >
                {form.requiredSkills.map((skill) => (
                  <li key={normalizeSkill(skill)} className="create-form__chip">
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill("requiredSkills", skill)}
                      aria-label={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="create-form__row">
            <label className="create-form__label" htmlFor="opp-preferred-skill">
              Preferred Skills (optional)
            </label>
            <div className="create-form__skill-input-row">
              <input
                id="opp-preferred-skill"
                className="create-form__input"
                type="text"
                name="preferredSkillInput"
                value={form.preferredSkillInput}
                onChange={handleChange}
                onKeyDown={(e) =>
                  handleSkillKeyDown(
                    e,
                    "preferredSkills",
                    "preferredSkillInput",
                    "preferredSkills",
                  )
                }
                placeholder="e.g. teamwork, Git, bookkeeping"
              />
              <button
                type="button"
                className="create-form__secondary-btn"
                onClick={() =>
                  addSkill(
                    "preferredSkills",
                    "preferredSkillInput",
                    "preferredSkills",
                  )
                }
              >
                Add
              </button>
            </div>
            {form.preferredSkills.length > 0 && (
              <ul
                className="create-form__skill-chip-list"
                aria-label="Preferred skills"
              >
                {form.preferredSkills.map((skill) => (
                  <li key={normalizeSkill(skill)} className="create-form__chip">
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill("preferredSkills", skill)}
                      aria-label={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </fieldset>

        <footer className="create-form__footer">
          <button
            className="create-form__submit-btn"
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "Posting..." : "Post Opportunity"}
          </button>
        </footer>
      </form>
    </section>
  );
}
