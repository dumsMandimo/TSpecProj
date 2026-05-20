import React, { useMemo, useState } from "react";
import {
  getSaqaQualifications,
  getSaqaFields,
  getSaqaSkillTags,
  getQualificationsByField,
  getSkillTagsByField,
  getSaqaScraperReport,
} from "../data/saqa/saqaData";

export default function SaqaDataTest() {
  const qualifications = getSaqaQualifications();
  const fields = getSaqaFields();
  const skillTags = getSaqaSkillTags();
  const report = getSaqaScraperReport();

  const [selectedField, setSelectedField] = useState("");

  const filteredQualifications = useMemo(() => {
    if (!selectedField) return qualifications.slice(0, 20);
    return getQualificationsByField(selectedField).slice(0, 20);
  }, [selectedField, qualifications]);

  const filteredSkillTags = useMemo(() => {
    if (!selectedField) return skillTags.slice(0, 20);
    return getSkillTagsByField(selectedField).slice(0, 20);
  }, [selectedField, skillTags]);

  return (
    <section style={{ padding: "2rem" }}>
      <h1>SAQA Data Test</h1>

      <p>
        <strong>Active dropdown qualifications:</strong> {qualifications.length}
      </p>
      <p>
        <strong>SAQA fields:</strong> {fields.length}
      </p>
      <p>
        <strong>Skill tags:</strong> {skillTags.length}
      </p>
      <p>
        <strong>NQF levels found:</strong>{" "}
        {report.nqf_levels_in_scraped_active_data?.join(", ")}
      </p>

      <label>
        Filter by field
        <select
          value={selectedField}
          onChange={(e) => setSelectedField(e.target.value)}
          style={{
            display: "block",
            margin: "0.5rem 0 1rem",
            padding: "0.5rem",
          }}
        >
          <option value="">All fields</option>
          {fields.map((field) => (
            <option key={field.field_code} value={field.field_name}>
              {field.field_name}
            </option>
          ))}
        </select>
      </label>

      <h2>Qualifications</h2>
      <ul>
        {filteredQualifications.map((qualification) => (
          <li key={qualification.value}>
            {qualification.label} — {qualification.field_name}
          </li>
        ))}
      </ul>

      <h2>SAQA-aligned Skill Tags</h2>
      <ul>
        {filteredSkillTags.map((tag) => (
          <li key={`${tag.name}-${tag.field_name}-${tag.nqf_level_number}`}>
            {tag.name} — {tag.field_name} — NQF {tag.nqf_level_number}
          </li>
        ))}
      </ul>
    </section>
  );
}
