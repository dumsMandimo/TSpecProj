import { useState, useEffect } from "react";
import {
  subscribeToProviderListings,
  updateOpportunity,
  deleteOpportunity,
  getApplicationCountsForListings,
  autoCloseExpiredListings,
} from "../../../services/providerService";
import { auth } from "../../../services/firebase";
import "./ListingsPanel.css";
import saqaFields from "../../../data/saqa/fields.json";
import saqaNqfLevels from "../../../data/saqa/nqf_levels.json";
import saqaSkillTags from "../../../data/saqa/skill_tags.json";
import saqaQualifications from "../../../data/saqa/qualification_dropdown.json";

const STATUS_LABELS = {
  approved: "Approved",
  pending: "Pending",
  closed: "Closed",
};

const STATUS_COLORS = {
  approved: "green",
  pending: "amber",
  closed: "grey",
};

const FILTERS = ["all", "approved", "pending", "closed"];

const OTHER_QUALIFICATION_VALUE = "OTHER_NOT_LISTED";

const today = new Date().toISOString().split("T")[0];

function formatDate(dateStr) {
  if (!dateStr) return null;
  const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isExpired(dateStr) {
  if (!dateStr) return false;
  const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
  return date < new Date();
}

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

function getSkillsArray(skills) {
  if (Array.isArray(skills)) return skills;

  if (typeof skills === "string" && skills.trim()) {
    return splitSkillInput(skills);
  }

  return [];
}

function getSavedValue(...values) {
  const found = values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  );

  return found ?? "";
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

function getLearningAreaOptions(sector, minimumNqfLevel) {
  if (!sector) return [];

  const selectedMinimumNqfLevel = minimumNqfLevel
    ? Number(minimumNqfLevel)
    : null;

  const filtered = saqaSkillTags.filter((tag) => {
    const matchesSector = tag.field_name === sector;

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
}

function getQualificationOptions(sector, minimumNqfLevel) {
  const selectedMinimumNqfLevel = minimumNqfLevel
    ? Number(minimumNqfLevel)
    : null;

  const filtered = saqaQualifications.filter((qualification) => {
    const matchesSector = !sector || qualification.field_name === sector;

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
}

export default function ListingsPanel({ initialFilter = "all" }) {
  const [listings, setListings] = useState([]);
  const [appCounts, setAppCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filter, setFilter] = useState(initialFilter);
  const [expanded, setExpanded] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    autoCloseExpiredListings(uid).catch(console.error);

    const unsubscribe = subscribeToProviderListings(
      uid,
      async (data) => {
        setListings(data);
        setLoading(false);

        const ids = data.map((l) => l.id);
        const counts = await getApplicationCountsForListings(ids);
        setAppCounts(counts);
      },
      () => {
        setError("Failed to load listings.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const handleEditOpen = (item) => {
    const savedSector = getSavedValue(
      item.sector,
      item.requiredQualificationFieldName,
    );

    const savedMinimumNqfLevel = getSavedValue(
      item.minimumNqfLevel,
      item.requiredQualificationNqfLevel,
    );

    const savedRequiredQualificationId = getSavedValue(
      item.requiredQualificationId,
    );

    const savedRequiredQualificationTitle = getSavedValue(
      item.requiredQualificationTitle,
    );

    const isUserEnteredQualification =
      item.requiredQualificationSource === "User entered" &&
      savedRequiredQualificationTitle;

    setEditingId(item.id);

    setEditForm({
      title: item.title ?? "",
      location: item.location ?? "",
      stipend: item.stipend ?? "",
      description: item.description ?? "",
      type: item.type ?? "learnership",
      closingDate: item.closingDate ?? "",

      // Previously saved matching fields
      sector: savedSector,
      minimumNqfLevel: savedMinimumNqfLevel ? String(savedMinimumNqfLevel) : "",

      requiredQualificationId: isUserEnteredQualification
        ? OTHER_QUALIFICATION_VALUE
        : savedRequiredQualificationId,
      requiredQualificationTitle: savedRequiredQualificationTitle,
      customQualificationTitle: isUserEnteredQualification
        ? savedRequiredQualificationTitle
        : "",

      requiredQualificationSource: item.requiredQualificationSource ?? "",
      requiredQualificationSourceUrl: item.requiredQualificationSourceUrl ?? "",
      requiredQualificationLearningSubfield:
        item.requiredQualificationLearningSubfield ?? "",
      requiredQualificationNqfLevel: getSavedValue(
        item.requiredQualificationNqfLevel,
        item.minimumNqfLevel,
      )
        ? String(
            getSavedValue(
              item.requiredQualificationNqfLevel,
              item.minimumNqfLevel,
            ),
          )
        : "",
      requiredQualificationFieldName: getSavedValue(
        item.requiredQualificationFieldName,
        item.sector,
      ),

      preferredLearningArea: item.preferredLearningArea ?? "",

      // Previously saved skills
      requiredSkills: getSkillsArray(item.requiredSkills),
      requiredSkillInput: "",
      preferredSkills: getSkillsArray(item.preferredSkills),
      preferredSkillInput: "",
    });

    setExpanded(item.id);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => {
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
  };

  const handleQualificationChange = (e) => {
    const selectedValue = e.target.value;

    if (!selectedValue) {
      setEditForm((prev) => ({
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
      return;
    }

    if (selectedValue === OTHER_QUALIFICATION_VALUE) {
      setEditForm((prev) => ({
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

    setEditForm((prev) => ({
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
  };

  const addEditSkill = (fieldName, inputName) => {
    const newSkills = splitSkillInput(editForm[inputName]);

    if (newSkills.length === 0) return;

    setEditForm((prev) => {
      const currentSkills = getSkillsArray(prev[fieldName]);
      const existingNormalizedSkills = new Set(
        currentSkills.map((skill) => normalizeSkill(skill)),
      );

      const uniqueNewSkills = newSkills.filter((skill) => {
        const normalized = normalizeSkill(skill);
        return normalized && !existingNormalizedSkills.has(normalized);
      });

      return {
        ...prev,
        [fieldName]: [...currentSkills, ...uniqueNewSkills],
        [inputName]: "",
      };
    });
  };

  const removeEditSkill = (fieldName, skillToRemove) => {
    setEditForm((prev) => ({
      ...prev,
      [fieldName]: getSkillsArray(prev[fieldName]).filter(
        (skill) => skill !== skillToRemove,
      ),
    }));
  };

  const handleEditSkillKeyDown = (e, fieldName, inputName) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEditSkill(fieldName, inputName);
    }
  };

  const handleEditSave = async (id) => {
    setSaving(true);

    try {
      const requiredSkills = getSkillsArray(editForm.requiredSkills);
      const preferredSkills = getSkillsArray(editForm.preferredSkills);

      const isOtherQualification =
        editForm.requiredQualificationId === OTHER_QUALIFICATION_VALUE;

      const finalRequiredQualificationTitle = isOtherQualification
        ? editForm.customQualificationTitle ||
          editForm.requiredQualificationTitle ||
          ""
        : editForm.requiredQualificationTitle || "";

      await updateOpportunity(id, {
        title: editForm.title,
        location: editForm.location,
        stipend: editForm.stipend,
        description: editForm.description,
        type: editForm.type,
        closingDate: editForm.closingDate,

        sector: editForm.sector || "",
        minimumNqfLevel: editForm.minimumNqfLevel
          ? Number(editForm.minimumNqfLevel)
          : null,

        requiredQualificationId: isOtherQualification
          ? null
          : editForm.requiredQualificationId || null,
        requiredQualificationTitle: finalRequiredQualificationTitle,
        requiredQualificationSource: editForm.requiredQualificationId
          ? editForm.requiredQualificationSource
          : "",
        requiredQualificationSourceUrl: isOtherQualification
          ? ""
          : editForm.requiredQualificationSourceUrl || "",
        requiredQualificationLearningSubfield: isOtherQualification
          ? ""
          : editForm.requiredQualificationLearningSubfield || "",
        requiredQualificationNqfLevel: editForm.requiredQualificationId
          ? Number(
              editForm.requiredQualificationNqfLevel ||
                editForm.minimumNqfLevel,
            )
          : null,
        requiredQualificationFieldName: editForm.requiredQualificationId
          ? editForm.requiredQualificationFieldName || editForm.sector
          : "",

        preferredLearningArea: editForm.preferredLearningArea || "",

        requiredSkills,
        normalizedRequiredSkills: requiredSkills.map((skill) =>
          normalizeSkill(skill),
        ),
        requiredSkillsText: requiredSkills.join(", "),

        preferredSkills,
        normalizedPreferredSkills: preferredSkills.map((skill) =>
          normalizeSkill(skill),
        ),
        preferredSkillsText: preferredSkills.join(", "),
      });

      setEditingId(null);
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async (id) => {
    setDeletingId(id);

    try {
      await deleteOpportunity(id);
      setConfirmDelete(null);

      if (expanded === id) setExpanded(null);
    } catch {
      setError("Failed to delete listing. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const visible =
    filter === "all" ? listings : listings.filter((l) => l.status === filter);

  if (loading)
    return (
      <section className="lp-loading" aria-label="Loading listings">
        <span className="lp-spinner" />
        <p>Loading your listings…</p>
      </section>
    );

  if (error)
    return (
      <p className="lp-error" role="alert">
        {error}
      </p>
    );

  return (
    <section className="lp" aria-label="My listings">
      <header className="lp__header">
        <section>
          <h2 className="lp__title">My Listings</h2>
          <p className="lp__subtitle">Manage all your posted opportunities</p>
        </section>

        <aside className="lp__summary" aria-label="Listings summary">
          <span className="lp__summary-chip">{listings.length} total</span>
        </aside>
      </header>

      <nav className="lp__filters" aria-label="Filter listings">
        {FILTERS.map((f) => {
          const count =
            f === "all"
              ? listings.length
              : listings.filter((l) => l.status === f).length;

          return (
            <button
              key={f}
              className={`lp__filter-btn${
                filter === f ? " lp__filter-btn--active" : ""
              }`}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              type="button"
            >
              {f === "all" ? "All" : (STATUS_LABELS[f] ?? f)}
              <output className="lp__filter-count">{count}</output>
            </button>
          );
        })}
      </nav>

      {visible.length === 0 ? (
        <section className="lp__empty">
          <p>
            No{" "}
            {filter !== "all"
              ? (STATUS_LABELS[filter] ?? filter).toLowerCase()
              : ""}{" "}
            listings yet.
          </p>
        </section>
      ) : (
        <ul className="lp__list">
          {visible.map((item) => {
            const isEditing = editingId === item.id;
            const isExpanded = expanded === item.id;
            const appCount = appCounts[item.id] ?? 0;
            const expired = isExpired(item.closingDate);

            const qualificationOptions = getQualificationOptions(
              editForm.sector,
              editForm.minimumNqfLevel,
            );

            const learningAreaOptions = getLearningAreaOptions(
              editForm.sector,
              editForm.minimumNqfLevel,
            );

            return (
              <li key={item.id} className="lp__item">
                <article className={`lc${isExpanded ? " lc--expanded" : ""}`}>
                  <header>
                    <button
                      className="lc__summary"
                      onClick={() => {
                        if (isEditing) return;
                        setExpanded(isExpanded ? null : item.id);
                      }}
                      aria-expanded={isExpanded}
                      type="button"
                    >
                      <section className="lc__left">
                        <span
                          className={`lc__status-dot lc__status-dot--${
                            STATUS_COLORS[item.status] ?? "grey"
                          }`}
                          aria-hidden="true"
                        />

                        <section>
                          <h3 className="lc__title">{item.title}</h3>
                          <p className="lc__meta">
                            {item.location}
                            {item.type && (
                              <>
                                {" "}
                                ·{" "}
                                {item.type.charAt(0).toUpperCase() +
                                  item.type.slice(1)}
                              </>
                            )}
                          </p>
                        </section>
                      </section>

                      <section className="lc__right">
                        <span
                          className={`lc__badge lc__badge--${
                            STATUS_COLORS[item.status] ?? "grey"
                          }`}
                        >
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>

                        <output
                          className="lc__app-count"
                          title="Applications received"
                        >
                          👥 {appCount}
                        </output>

                        {expired && item.status === "approved" && (
                          <span className="lc__expired-tag">Expired</span>
                        )}

                        <span className="lc__chevron" aria-hidden="true">
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </section>
                    </button>
                  </header>

                  {isExpanded && (
                    <main className="lc__body">
                      {isEditing ? (
                        <form
                          className="lc__edit-form"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleEditSave(item.id);
                          }}
                        >
                          <fieldset className="lc__edit-grid">
                            <legend className="sr-only">Edit listing</legend>

                            <label>
                              Title
                              <input
                                name="title"
                                value={editForm.title}
                                onChange={handleEditChange}
                                required
                              />
                            </label>

                            <label>
                              Type
                              <select
                                name="type"
                                value={editForm.type}
                                onChange={handleEditChange}
                              >
                                <option value="learnership">Learnership</option>
                                <option value="internship">Internship</option>
                                <option value="apprenticeship">
                                  Apprenticeship
                                </option>
                                <option value="graduate">
                                  Graduate Programme
                                </option>
                              </select>
                            </label>

                            <label>
                              Location
                              <input
                                name="location"
                                value={editForm.location}
                                onChange={handleEditChange}
                                required
                              />
                            </label>

                            <label>
                              Stipend
                              <input
                                name="stipend"
                                value={editForm.stipend}
                                onChange={handleEditChange}
                              />
                            </label>

                            <label>
                              Closing Date
                              <input
                                type="date"
                                name="closingDate"
                                value={editForm.closingDate}
                                onChange={handleEditChange}
                                min={today}
                              />
                            </label>

                            <label>
                              Sector / SAQA Field
                              <select
                                name="sector"
                                value={editForm.sector}
                                onChange={handleEditChange}
                              >
                                <option value="">Select sector</option>
                                {saqaFields.map((field) => (
                                  <option
                                    key={field.field_name}
                                    value={field.field_name}
                                  >
                                    {field.field_name}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label>
                              Minimum NQF Level
                              <select
                                name="minimumNqfLevel"
                                value={editForm.minimumNqfLevel}
                                onChange={handleEditChange}
                              >
                                <option value="">
                                  Select minimum NQF level
                                </option>
                                {saqaNqfLevels.map((level) => (
                                  <option
                                    key={level.level}
                                    value={String(level.level)}
                                  >
                                    {level.group}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label>
                              Specific Qualification
                              <select
                                name="requiredQualificationId"
                                value={editForm.requiredQualificationId}
                                onChange={handleQualificationChange}
                                disabled={
                                  !editForm.sector && !editForm.minimumNqfLevel
                                }
                              >
                                <option value="">
                                  {editForm.sector || editForm.minimumNqfLevel
                                    ? "No specific qualification required"
                                    : "Select sector or NQF level first"}
                                </option>

                                {qualificationOptions.map((qualification) => (
                                  <option
                                    key={qualification.value}
                                    value={qualification.value}
                                  >
                                    {qualification.label}
                                  </option>
                                ))}

                                <option value={OTHER_QUALIFICATION_VALUE}>
                                  Other / Not listed
                                </option>
                              </select>
                            </label>

                            {editForm.requiredQualificationId ===
                              OTHER_QUALIFICATION_VALUE && (
                              <label>
                                Enter qualification name
                                <input
                                  name="customQualificationTitle"
                                  value={editForm.customQualificationTitle}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      customQualificationTitle: e.target.value,
                                      requiredQualificationTitle:
                                        e.target.value,
                                    }))
                                  }
                                  placeholder="e.g. National Senior Certificate / Matric"
                                />
                              </label>
                            )}

                            <label>
                              Preferred SAQA Learning Area
                              <select
                                name="preferredLearningArea"
                                value={editForm.preferredLearningArea}
                                onChange={handleEditChange}
                                disabled={!editForm.sector}
                              >
                                <option value="">
                                  {editForm.sector
                                    ? "No specific learning area"
                                    : "Select sector first"}
                                </option>
                                {learningAreaOptions.map((tag) => (
                                  <option
                                    key={`${tag.name}-${tag.field_name}`}
                                    value={tag.name}
                                  >
                                    {tag.name}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="lc__edit-full">
                              Description
                              <textarea
                                name="description"
                                value={editForm.description}
                                onChange={handleEditChange}
                                rows={4}
                                required
                              />
                            </label>
                          </fieldset>

                          <section className="lc__edit-section">
                            <strong>Required Skills</strong>
                            <div className="lc__skill-input-row">
                              <input
                                name="requiredSkillInput"
                                value={editForm.requiredSkillInput}
                                onChange={handleEditChange}
                                onKeyDown={(e) =>
                                  handleEditSkillKeyDown(
                                    e,
                                    "requiredSkills",
                                    "requiredSkillInput",
                                  )
                                }
                                placeholder="e.g. Excel, Java, communication"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  addEditSkill(
                                    "requiredSkills",
                                    "requiredSkillInput",
                                  )
                                }
                              >
                                Add
                              </button>
                            </div>

                            {getSkillsArray(editForm.requiredSkills).length >
                              0 && (
                              <ul className="lc__chip-list">
                                {getSkillsArray(editForm.requiredSkills).map(
                                  (skill) => (
                                    <li
                                      key={normalizeSkill(skill)}
                                      className="lc__chip"
                                    >
                                      <span>{skill}</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeEditSkill(
                                            "requiredSkills",
                                            skill,
                                          )
                                        }
                                        aria-label={`Remove ${skill}`}
                                      >
                                        ×
                                      </button>
                                    </li>
                                  ),
                                )}
                              </ul>
                            )}
                          </section>

                          <section className="lc__edit-section">
                            <strong>Preferred Skills</strong>
                            <div className="lc__skill-input-row">
                              <input
                                name="preferredSkillInput"
                                value={editForm.preferredSkillInput}
                                onChange={handleEditChange}
                                onKeyDown={(e) =>
                                  handleEditSkillKeyDown(
                                    e,
                                    "preferredSkills",
                                    "preferredSkillInput",
                                  )
                                }
                                placeholder="e.g. teamwork, Git, bookkeeping"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  addEditSkill(
                                    "preferredSkills",
                                    "preferredSkillInput",
                                  )
                                }
                              >
                                Add
                              </button>
                            </div>

                            {getSkillsArray(editForm.preferredSkills).length >
                              0 && (
                              <ul className="lc__chip-list">
                                {getSkillsArray(editForm.preferredSkills).map(
                                  (skill) => (
                                    <li
                                      key={normalizeSkill(skill)}
                                      className="lc__chip"
                                    >
                                      <span>{skill}</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeEditSkill(
                                            "preferredSkills",
                                            skill,
                                          )
                                        }
                                        aria-label={`Remove ${skill}`}
                                      >
                                        ×
                                      </button>
                                    </li>
                                  ),
                                )}
                              </ul>
                            )}
                          </section>

                          <footer className="lc__edit-actions">
                            <button type="submit" disabled={saving}>
                              {saving ? "Saving…" : "Save Changes"}
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </footer>
                        </form>
                      ) : (
                        <section className="lc__details">
                          {item.stipend && (
                            <p>
                              <strong>Stipend:</strong> {item.stipend}
                            </p>
                          )}

                          {item.closingDate && (
                            <p>
                              <strong>Closing Date:</strong>{" "}
                              <span
                                className={expired ? "lc__expired-text" : ""}
                              >
                                {formatDate(item.closingDate)}
                                {expired && " (Expired)"}
                              </span>
                            </p>
                          )}

                          <p>
                            <strong>Applications:</strong> {appCount} received
                          </p>

                          <section className="lc__detail-group">
                            <h4>Matching Requirements</h4>

                            <p>
                              <strong>Sector:</strong> {item.sector || "—"}
                            </p>

                            <p>
                              <strong>Minimum NQF Level:</strong>{" "}
                              {item.minimumNqfLevel
                                ? `NQF ${item.minimumNqfLevel}`
                                : "—"}
                            </p>

                            <p>
                              <strong>Specific Qualification:</strong>{" "}
                              {item.requiredQualificationTitle || "—"}
                            </p>

                            <p>
                              <strong>Preferred Learning Area:</strong>{" "}
                              {item.preferredLearningArea || "—"}
                            </p>

                            {item.requiredQualificationSourceUrl && (
                              <p>
                                <strong>Qualification Source:</strong>{" "}
                                <a
                                  href={item.requiredQualificationSourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View SAQA source
                                </a>
                              </p>
                            )}
                          </section>

                          <section className="lc__detail-group">
                            <h4>Required Skills</h4>
                            {getSkillsArray(item.requiredSkills).length > 0 ? (
                              <ul className="lc__chip-list">
                                {getSkillsArray(item.requiredSkills).map(
                                  (skill) => (
                                    <li
                                      key={normalizeSkill(skill)}
                                      className="lc__chip"
                                    >
                                      <span>{skill}</span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            ) : (
                              <p>—</p>
                            )}
                          </section>

                          <section className="lc__detail-group">
                            <h4>Preferred Skills</h4>
                            {getSkillsArray(item.preferredSkills).length > 0 ? (
                              <ul className="lc__chip-list">
                                {getSkillsArray(item.preferredSkills).map(
                                  (skill) => (
                                    <li
                                      key={normalizeSkill(skill)}
                                      className="lc__chip"
                                    >
                                      <span>{skill}</span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            ) : (
                              <p>—</p>
                            )}
                          </section>

                          {item.description && (
                            <section>
                              <strong>Description</strong>
                              <p>{item.description}</p>
                            </section>
                          )}

                          <footer>
                            <button
                              type="button"
                              onClick={() => handleEditOpen(item)}
                            >
                              ✏️ Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmDelete(item.id)}
                            >
                              🗑 Delete
                            </button>
                          </footer>

                          {confirmDelete === item.id && (
                            <aside>
                              <p>
                                Are you sure you want to delete{" "}
                                <strong>{item.title}</strong>?
                              </p>

                              <div>
                                <button
                                  onClick={() => handleDeleteConfirm(item.id)}
                                  disabled={deletingId === item.id}
                                  type="button"
                                >
                                  {deletingId === item.id
                                    ? "Deleting…"
                                    : "Yes, Delete"}
                                </button>

                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  type="button"
                                >
                                  Cancel
                                </button>
                              </div>
                            </aside>
                          )}
                        </section>
                      )}
                    </main>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
