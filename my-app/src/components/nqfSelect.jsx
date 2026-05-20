import { useState, useRef, useEffect, useMemo } from "react";
import saqaFields from "../data/saqa/fields.json";
import saqaQualifications from "../data/saqa/qualification_dropdown.json";
import saqaSkillTags from "../data/saqa/skill_tags.json";
import saqaNqfLevels from "../data/saqa/nqf_levels.json";

const NQF_LEVELS = saqaNqfLevels;

const OTHER_QUALIFICATION_VALUE = "OTHER_NOT_LISTED";

function getNqfLevelFromValue(value) {
  if (!value) return null;

  const match = String(value).match(/NQF\s*Level\s*(\d+)|NQF\s*(\d+)/i);
  const level = match ? Number(match[1] || match[2]) : null;

  return Number.isInteger(level) ? level : null;
}

function useCloseOnOutsideClick(ref, setOpen) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, setOpen]);
}

function isAtOrBelowSelectedNqf(itemLevel, selectedNqfLevel) {
  if (!selectedNqfLevel) return true;
  if (!itemLevel) return false;

  return Number(itemLevel) <= Number(selectedNqfLevel);
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

export function NqfDropdown({ value, onChange, required }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const ref = useRef(null);

  useCloseOnOutsideClick(ref, setOpen);

  const pick = (name, group, level) => {
    const selectedValue = `${name} (${group})`;

    setSelected({ name, group, level });

    onChange({
      target: {
        value: selectedValue,
        name: "qualification",
        dataset: {
          nqfLevel: String(level),
          qualificationType: name,
        },
      },
    });

    setOpen(false);
  };

  const displayValue = selected
    ? `${selected.name} (${selected.group})`
    : value || "Select NQF level";

  return (
    <section ref={ref} className="nqf-dropdown">
      <input
        type="text"
        required={required}
        value={value || ""}
        readOnly
        style={{ display: "none" }}
      />

      <button
        type="button"
        className={`nqf-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value || selected ? "" : "placeholder"}>
          {displayValue}
        </span>
        <span className="nqf-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul className="nqf-list">
          {[...NQF_LEVELS]
            .sort((a, b) => Number(a.level) - Number(b.level))
            .map(({ group, level, options }) => (
              <li key={group}>
                <p className="nqf-group-label">{group}</p>
                {(options || []).map((name) => (
                  <button
                    key={`${group}-${name}`}
                    type="button"
                    className={`nqf-option ${
                      selected?.name === name ? "selected" : ""
                    }`}
                    onClick={() => pick(name, group, level)}
                  >
                    {name}
                  </button>
                ))}
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

export function SectorDropdown({ value, onChange, required }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useCloseOnOutsideClick(ref, setOpen);

  const sectors = useMemo(
    () => saqaFields.map((field) => field.field_name),
    [],
  );

  const pick = (name) => {
    onChange({
      target: {
        value: name,
        name: "sector",
      },
    });

    setOpen(false);
  };

  return (
    <section ref={ref} className="custom-dropdown">
      <input
        type="text"
        required={required}
        value={value || ""}
        readOnly
        style={{ display: "none" }}
      />

      <button
        type="button"
        className={`custom-dropdown-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? "" : "placeholder"}>
          {value || "Select sector"}
        </span>
        <span className="custom-dropdown-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul className="custom-dropdown-list">
          {sectors.map((name) => (
            <li key={name}>
              <button
                type="button"
                className={`custom-dropdown-option ${
                  value === name ? "selected" : ""
                }`}
                onClick={() => pick(name)}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SaqaQualificationDropdown({
  value,
  onChange,
  required,
  selectedNqf,
  selectedSector,
  includeOther = true,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useCloseOnOutsideClick(ref, setOpen);

  const selectedNqfLevel = useMemo(
    () =>
      typeof selectedNqf === "number"
        ? selectedNqf
        : getNqfLevelFromValue(selectedNqf),
    [selectedNqf],
  );

  const filteredQualifications = useMemo(() => {
    const filtered = saqaQualifications.filter((qualification) => {
      const matchesNqf =
        !selectedNqfLevel ||
        Number(qualification.nqf_level_number) <= Number(selectedNqfLevel);

      const matchesSector =
        !selectedSector || qualification.field_name === selectedSector;

      return matchesNqf && matchesSector;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (a.nqf_level_number !== b.nqf_level_number) {
        return b.nqf_level_number - a.nqf_level_number;
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
  }, [selectedNqfLevel, selectedSector]);

  const selectedQualification = useMemo(() => {
    if (value === OTHER_QUALIFICATION_VALUE) {
      return {
        label: "Other / Not listed",
        value: OTHER_QUALIFICATION_VALUE,
      };
    }

    return saqaQualifications.find(
      (qualification) => qualification.value === value,
    );
  }, [value]);

  const pick = (qualification) => {
    onChange({
      target: {
        value: qualification.value,
        name: "saqaQualificationId",
        dataset: {
          title: qualification.title || "",
          nqfLevel: qualification.nqf_level_number
            ? String(qualification.nqf_level_number)
            : "",
          fieldName: qualification.field_name || "",
          learningSubfield: qualification.learning_subfield || "",
          sourceUrl: qualification.source_url || "",
          isOther:
            qualification.value === OTHER_QUALIFICATION_VALUE
              ? "true"
              : "false",
        },
      },
    });

    setOpen(false);
  };

  return (
    <section ref={ref} className="custom-dropdown">
      <input
        type="text"
        required={required}
        value={value || ""}
        readOnly
        style={{ display: "none" }}
      />

      <button
        type="button"
        className={`custom-dropdown-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? "" : "placeholder"}>
          {selectedQualification?.label || "Select specific qualification"}
        </span>
        <span className="custom-dropdown-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul className="custom-dropdown-list">
          {filteredQualifications.length === 0 && (
            <li>
              <p className="custom-dropdown-empty">
                No SAQA qualification found for this filter.
              </p>
            </li>
          )}

          {filteredQualifications.map((qualification) => (
            <li
              key={`${normalizeKey(qualification.label)}-${normalizeKey(
                qualification.field_name,
              )}`}
            >
              <button
                type="button"
                className={`custom-dropdown-option ${
                  value === qualification.value ? "selected" : ""
                }`}
                onClick={() => pick(qualification)}
              >
                {qualification.label}
              </button>
            </li>
          ))}

          {includeOther && (
            <li>
              <button
                type="button"
                className={`custom-dropdown-option ${
                  value === OTHER_QUALIFICATION_VALUE ? "selected" : ""
                }`}
                onClick={() =>
                  pick({
                    value: OTHER_QUALIFICATION_VALUE,
                    label: "Other / Not listed",
                  })
                }
              >
                Other / Not listed
              </button>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

export function SaqaSkillTagDropdown({
  value,
  onChange,
  required,
  selectedSector,
  selectedNqf,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useCloseOnOutsideClick(ref, setOpen);

  const selectedNqfLevel = useMemo(
    () =>
      typeof selectedNqf === "number"
        ? selectedNqf
        : getNqfLevelFromValue(selectedNqf),
    [selectedNqf],
  );

  const filteredSkillTags = useMemo(() => {
    const filtered = saqaSkillTags.filter((tag) => {
      const matchesNqf =
        !selectedNqfLevel ||
        Number(tag.nqf_level_number) <= Number(selectedNqfLevel);

      const matchesSector =
        !selectedSector || tag.field_name === selectedSector;

      return matchesNqf && matchesSector;
    });

    const sorted = filtered.sort((a, b) => {
      if (a.name !== b.name) {
        return a.name.localeCompare(b.name);
      }

      return b.nqf_level_number - a.nqf_level_number;
    });

    return dedupeByKey(sorted, (tag) => `${tag.name}-${tag.field_name}`);
  }, [selectedSector, selectedNqfLevel]);

  const selectedTag = useMemo(
    () =>
      saqaSkillTags.find(
        (tag) =>
          `${tag.name}-${tag.field_name}-${tag.nqf_level_number}` === value,
      ),
    [value],
  );

  const pick = (tag) => {
    const selectedValue = `${tag.name}-${tag.field_name}-${tag.nqf_level_number}`;

    onChange({
      target: {
        value: selectedValue,
        name: "saqaSkillTag",
        dataset: {
          name: tag.name,
          fieldName: tag.field_name,
          fieldCode: tag.field_code || "",
          nqfLevel: String(tag.nqf_level_number),
          sourceUrl: tag.source_url || "",
        },
      },
    });

    setOpen(false);
  };

  return (
    <section ref={ref} className="custom-dropdown">
      <input
        type="text"
        required={required}
        value={value || ""}
        readOnly
        style={{ display: "none" }}
      />

      <button
        type="button"
        className={`custom-dropdown-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? "" : "placeholder"}>
          {selectedTag
            ? `${selectedTag.name} — NQF ${selectedTag.nqf_level_number}`
            : "Select SAQA-aligned skill area"}
        </span>
        <span className="custom-dropdown-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul className="custom-dropdown-list">
          {filteredSkillTags.length === 0 && (
            <li>
              <p className="custom-dropdown-empty">
                No skill tags found for this filter.
              </p>
            </li>
          )}

          {filteredSkillTags.map((tag) => {
            const tagValue = `${tag.name}-${tag.field_name}-${tag.nqf_level_number}`;

            return (
              <li key={tagValue}>
                <button
                  type="button"
                  className={`custom-dropdown-option ${
                    value === tagValue ? "selected" : ""
                  }`}
                  onClick={() => pick(tag)}
                >
                  {tag.name} — NQF {tag.nqf_level_number}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export { NQF_LEVELS, OTHER_QUALIFICATION_VALUE };
