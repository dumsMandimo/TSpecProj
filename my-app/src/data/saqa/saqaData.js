import qualificationDropdown from "./qualification_dropdown.json";
import fields from "./fields.json";
import skillTags from "./skill_tags.json";
import scraperReport from "./scraper_report.json";

export function getSaqaQualifications() {
  return qualificationDropdown;
}

export function getSaqaFields() {
  return fields;
}

export function getSaqaSkillTags() {
  return skillTags;
}

export function getSaqaScraperReport() {
  return scraperReport;
}

export function getQualificationsByNqfLevel(nqfLevel) {
  return qualificationDropdown.filter(
    (qualification) => qualification.nqf_level_number === Number(nqfLevel)
  );
}

export function getQualificationsByField(fieldName) {
  return qualificationDropdown.filter(
    (qualification) => qualification.field_name === fieldName
  );
}

export function getSkillTagsByField(fieldName) {
  return skillTags.filter((tag) => tag.field_name === fieldName);
}

export function getSkillTagsByNqfLevel(nqfLevel) {
  return skillTags.filter(
    (tag) => tag.nqf_level_number === Number(nqfLevel)
  );
}