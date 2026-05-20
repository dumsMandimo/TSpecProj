import { useMemo, useState } from "react";
import { createOpportunity } from "../../../services/providerService";
import { auth } from "../../../services/firebase";
import "./CreateOpportunityForm.css";
import saqaFields from "../../../data/saqa/fields.json";
import saqaSkillTags from "../../../data/saqa/skill_tags.json";
import saqaQualifications from "../../../data/saqa/qualification_dropdown.json";

const today = new Date().toISOString().split("T")[0];

const OTHER_QUALIFICATION_VALUE = "OTHER_NOT_LISTED";

const NQF_LEVELS = [
  { value: "1", label: "NQF 1" },
  { value: "2", label: "NQF 2" },
  { value: "3", label: "NQF 3" },
  { value: "4", label: "NQF 4" },
  { value: "5", label: "NQF 5" },
  { value: "6", label: "NQF 6" },
  { value: "7", label: "NQF 7" },
  { value: "8", label: "NQF 8" },
  { value: "9", label: "NQF 9" },
  { value: "10", label: "NQF 10" },
];

const EMPTY_FORM = {
  title: "",
  location: "",
  stipend: "",
  description: "",
  type: "learnership",
  closingDate: "",

  sector: "",
  minimumNqfLevel: "",

  requiredQualificationId: "",
  requiredQualificationTitle: "",
  customQualificationTitle: "",
  requiredQualificationSource: "",
  requiredQualificationSourceUrl: "",
  requiredQualificationLearningSubfield: "",
  requiredQualificationNqfLevel: "",
  requiredQualificationFieldName: "",

  preferredLearningArea: "",

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

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSkillInput(input) {
  return String(input || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function dedupeByKey(items, getKey) {
  const seen = new Set();

  return items.filter((item) => {
    const key = getKey(item);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export default function CreateOpportunityForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const sectors = useMemo(
    () => saqaFields.map((field) => field.field_name),
    [],
  );

  const selectedMinimumNqfLevel = form.minimumNqfLevel
    ? Number(form.minimumNqfLevel)
    : null;

  const qualificationOptions = useMemo(() => {
    const filtered = saqaQualifications.filter((qualification) => {
      const matchesSector =
        !form.sector || qualification.field_name === form.sector;

      const matchesNqf =
        !selectedMinimumNqfLevel ||
        Number(qualification.nqf_level_number) === selectedMinimumNqfLevel;

      return matchesSector && matchesNqf;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (a.nqf_level_number !== b.nqf_level_number) {
        return a.nqf_level_number - b.nqf_level_number;
      }

      return a.label.localeCompare(b.label);
    });

    return dedupeByKey(
      sorted,
      (qualification) =>
        `${normalizeKey(qualification.label)}-${normalizeKey(
          qualification.field_name,
        )}`,
    );
  }, [form.sector, selectedMinimumNqfLevel]);

  const learningAreaOptions = useMemo(() => {
    if (!form.sector) return [];

    const filtered = saqaSkillTags.filter((tag) => {
      const matchesSector = tag.field_name === form.sector;

      const matchesNqf =
        !selectedMinimumNqfLevel ||
        Number(tag.nqf_level_number) <= selectedMinimumNqfLevel;

      return matchesSector && matchesNqf;
    });

    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

    return dedupeByKey(
      sorted,
      (tag) => `${normalizeKey(tag.name)}-${normalizeKey(tag.field_name)}`,
    );
  }, [form.sector, selectedMinimumNqfLevel]);

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
      form.requiredQualificationId === OTHER_QUALIFICATION_VALUE &&
      !form.customQualificationTitle.trim()
    ) {
      next.customQualificationTitle =
        "Enter the qualification name or choose a SAQA option.";
    }

    if (form.requiredSkills.length === 0) {
      next.requiredSkills = "Add at least one required skill.";
    }

    return next;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "sector" || name === "minimumNqfLevel") {
        next.preferredLearningArea = "";
        next.requiredQualificationId = "";
        next.requiredQualificationTitle = "";
        next.customQualificationTitle = "";
        next.requiredQualificationSource = "";
        next.requiredQualificationSourceUrl = "";
        next.requiredQualificationLearningSubfield = "";
        next.requiredQualificationNqfLevel = "";
        next.requiredQualificationFieldName = "";
      }

      return next;
    });

    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSuccessMsg("");
  };

  const handleQualificationChange = (e) => {
    const selectedValue = e.target.value;

    if (!selectedValue) {
      setForm((prev) => ({
        ...prev,
        requiredQualificationId: "",
        requiredQualificationTitle: "",
        customQualificationTitle: "",
        requiredQualificationSource: "",
        requiredQualificationSourceUrl: "",
        requiredQualificationLearningSubfield: "",
        requiredQualificationNqfLevel: "",
        requiredQualificationFieldName: "",
      }));
      setErrors((prev) => ({ ...prev, customQualificationTitle: undefined }));
      return;
    }

    if (selectedValue === OTHER_QUALIFICATION_VALUE) {
      setForm((prev) => ({
        ...prev,
        requiredQualificationId: OTHER_QUALIFICATION_VALUE,
        requiredQualificationTitle: "",
        customQualificationTitle: "",
        requiredQualificationSource: "User entered",
        requiredQualificationSourceUrl: "",
        requiredQualificationLearningSubfield: "",
        requiredQualificationNqfLevel: prev.minimumNqfLevel,
        requiredQualificationFieldName: prev.sector,
      }));
      return;
    }

    const selectedQualification = saqaQualifications.find(
      (qualification) => qualification.value === selectedValue,
    );

    if (!selectedQualification) return;

    setForm((prev) => ({
      ...prev,
      requiredQualificationId: selectedQualification.value,
      requiredQualificationTitle:
        selectedQualification.title || selectedQualification.label || "",
      customQualificationTitle: "",
      requiredQualificationSource: "SAQA",
      requiredQualificationSourceUrl: selectedQualification.source_url || "",
      requiredQualificationLearningSubfield:
        selectedQualification.learning_subfield || "",
      requiredQualificationNqfLevel:
        selectedQualification.nqf_level_number || prev.minimumNqfLevel,
      requiredQualificationFieldName:
        selectedQualification.field_name || prev.sector,
      preferredLearningArea:
        prev.preferredLearningArea ||
        selectedQualification.learning_subfield ||
        "",
    }));

    setErrors((prev) => ({ ...prev, customQualificationTitle: undefined }));
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

      const isOtherQualification =
        form.requiredQualificationId === OTHER_QUALIFICATION_VALUE;

      const finalRequiredQualificationTitle = isOtherQualification
        ? form.customQualificationTitle
        : form.requiredQualificationTitle;

      await createOpportunity({
        title: form.title,
        location: form.location,
        stipend: form.stipend,
        description: form.description,
        type: form.type,
        closingDate: form.closingDate,

        sector: form.sector,
        minimumNqfLevel: Number(form.minimumNqfLevel),

        requiredQualificationId: isOtherQualification
          ? null
          : form.requiredQualificationId || null,
        requiredQualificationTitle: finalRequiredQualificationTitle || "",
        requiredQualificationSource: form.requiredQualificationId
          ? form.requiredQualificationSource
          : "",
        requiredQualificationSourceUrl: isOtherQualification
          ? ""
          : form.requiredQualificationSourceUrl || "",
        requiredQualificationLearningSubfield: isOtherQualification
          ? ""
          : form.requiredQualificationLearningSubfield || "",
        requiredQualificationNqfLevel: form.requiredQualificationId
          ? Number(form.requiredQualificationNqfLevel || form.minimumNqfLevel)
          : null,
        requiredQualificationFieldName: form.requiredQualificationId
          ? form.requiredQualificationFieldName || form.sector
          : "",

        preferredLearningArea: form.preferredLearningArea,

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
            <label className="create-form__label" htmlFor="opp-sector">
              Sector / SAQA Field <span aria-hidden="true">*</span>
            </label>
            <select
              id="opp-sector"
              className={`create-form__select${
                errors.sector ? " create-form__input--error" : ""
              }`}
              name="sector"
              value={form.sector}
              onChange={handleChange}
              aria-required="true"
              aria-describedby={errors.sector ? "opp-sector-err" : undefined}
            >
              <option value="">Select sector</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
            {errors.sector && (
              <p
                id="opp-sector-err"
                className="create-form__field-error"
                role="alert"
              >
                {errors.sector}
              </p>
            )}
          </section>

          <section className="create-form__row create-form__row--half">
            <label className="create-form__label" htmlFor="opp-min-nqf">
              Minimum NQF Level <span aria-hidden="true">*</span>
            </label>
            <select
              id="opp-min-nqf"
              className={`create-form__select${
                errors.minimumNqfLevel ? " create-form__input--error" : ""
              }`}
              name="minimumNqfLevel"
              value={form.minimumNqfLevel}
              onChange={handleChange}
              aria-required="true"
              aria-describedby={
                errors.minimumNqfLevel ? "opp-min-nqf-err" : undefined
              }
            >
              <option value="">Select minimum NQF level</option>
              {NQF_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            {errors.minimumNqfLevel && (
              <p
                id="opp-min-nqf-err"
                className="create-form__field-error"
                role="alert"
              >
                {errors.minimumNqfLevel}
              </p>
            )}
          </section>

          <section className="create-form__row">
            <label className="create-form__label" htmlFor="opp-qualification">
              Specific Qualification Name (optional)
            </label>
            <select
              id="opp-qualification"
              className="create-form__select"
              name="requiredQualificationId"
              value={form.requiredQualificationId}
              onChange={handleQualificationChange}
              disabled={!form.sector && !form.minimumNqfLevel}
            >
              <option value="">
                {form.sector || form.minimumNqfLevel
                  ? "No specific qualification required"
                  : "Select sector or NQF level first"}
              </option>

              {qualificationOptions.map((qualification) => (
                <option key={qualification.value} value={qualification.value}>
                  {qualification.label}
                </option>
              ))}

              <option value={OTHER_QUALIFICATION_VALUE}>
                Other / Not listed
              </option>
            </select>
            <p className="create-form__helper">
              Use this when the opportunity requires or prefers a specific
              qualification, not just a broad NQF level.
            </p>
          </section>

          {form.requiredQualificationId === OTHER_QUALIFICATION_VALUE && (
            <section className="create-form__row">
              <label
                className="create-form__label"
                htmlFor="opp-custom-qualification"
              >
                Enter qualification name <span aria-hidden="true">*</span>
              </label>
              <input
                id="opp-custom-qualification"
                className={`create-form__input${
                  errors.customQualificationTitle
                    ? " create-form__input--error"
                    : ""
                }`}
                type="text"
                name="customQualificationTitle"
                value={form.customQualificationTitle}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    customQualificationTitle: e.target.value,
                    requiredQualificationTitle: e.target.value,
                  }))
                }
                placeholder="e.g. National Senior Certificate / Matric"
                aria-describedby={
                  errors.customQualificationTitle
                    ? "opp-custom-qualification-err"
                    : undefined
                }
              />
              {errors.customQualificationTitle && (
                <p
                  id="opp-custom-qualification-err"
                  className="create-form__field-error"
                  role="alert"
                >
                  {errors.customQualificationTitle}
                </p>
              )}
            </section>
          )}

          <section className="create-form__row">
            <label className="create-form__label" htmlFor="opp-learning-area">
              Preferred SAQA Learning Area (optional)
            </label>
            <select
              id="opp-learning-area"
              className="create-form__select"
              name="preferredLearningArea"
              value={form.preferredLearningArea}
              onChange={handleChange}
              disabled={!form.sector}
            >
              <option value="">
                {form.sector
                  ? "No specific learning area"
                  : "Select sector first"}
              </option>
              {learningAreaOptions.map((tag) => (
                <option key={`${tag.name}-${tag.field_name}`} value={tag.name}>
                  {tag.name}
                </option>
              ))}
            </select>
            <p className="create-form__helper">
              Select a sector first. Learning areas are filtered by sector and,
              if selected, minimum NQF level.
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
