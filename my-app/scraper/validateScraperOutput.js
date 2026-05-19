const fs = require("fs");

function readJson(path) {
  if (!fs.existsSync(path)) {
    throw new Error(`Missing file: ${path}`);
  }

  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateQualifications(qualifications) {
  assert(Array.isArray(qualifications), "qualifications_active.json must be an array");
  assert(qualifications.length > 0, "No active qualifications found");

  qualifications.forEach((q, index) => {
    assert(q.saqa_id, `Missing saqa_id at index ${index}`);
    assert(q.title, `Missing title at index ${index}`);

    assert(
      typeof q.nqf_level_number === "number",
      `Invalid NQF level for ${q.title}`
    );

    assert(
      q.nqf_level_number >= 1 && q.nqf_level_number <= 10,
      `NQF level out of range for ${q.title}`
    );

    assert(q.field_name, `Missing field_name for ${q.title}`);
    assert(q.learning_subfield, `Missing learning_subfield for ${q.title}`);
    assert(q.source === "SAQA", `Missing SAQA source for ${q.title}`);
    assert(q.source_url, `Missing source_url for ${q.title}`);
  });
}

function validateDropdown(dropdown) {
  assert(Array.isArray(dropdown), "qualification_dropdown.json must be an array");
  assert(dropdown.length > 0, "No dropdown items found");

  dropdown.forEach((item, index) => {
    assert(item.value, `Missing dropdown value at index ${index}`);
    assert(item.label, `Missing dropdown label at index ${index}`);

    assert(
      item.label.includes("NQF Level"),
      `Dropdown label does not include NQF Level at index ${index}`
    );
  });
}

function validateNoHeaderRows(qualifications) {
  const badRows = qualifications.filter(
    (q) =>
      q.saqa_id === "Qual / Prog ID" ||
      q.title === "Qualification Title / Learning Programme Title"
  );

  assert(badRows.length === 0, "Header row was accidentally saved as data");
}

function validateNoDuplicatesInActiveQualifications(qualifications) {
  const ids = qualifications.map((q) => q.saqa_id);
  const uniqueIds = new Set(ids);

  assert(
    ids.length === uniqueIds.size,
    "Duplicate SAQA IDs found in qualifications_active.json"
  );
}

function validateRawScrapedData(raw) {
  assert(Array.isArray(raw), "qualifications_scraped_raw.json must be an array");
  assert(raw.length > 0, "No raw scraped qualifications found");

  const rawIds = raw.map((q) => q.saqa_id);
  const uniqueRawIds = new Set(rawIds);

  if (rawIds.length !== uniqueRawIds.size) {
    console.warn("Warning: duplicate SAQA IDs found in raw scraped data.");
  }

  console.log(`Raw scraped rows: ${raw.length}`);
  console.log(`Unique scraped SAQA IDs: ${uniqueRawIds.size}`);
}

function main() {
  const qualifications = readJson("./qualifications_active.json");
  const dropdown = readJson("./qualification_dropdown.json");
  const fields = readJson("./fields.json");
  const skillTags = readJson("./skill_tags.json");
  const raw = readJson("./qualifications_scraped_raw.json");

  validateQualifications(qualifications);
  validateDropdown(dropdown);
  validateNoHeaderRows(qualifications);
  validateNoDuplicatesInActiveQualifications(qualifications);

  assert(Array.isArray(fields), "fields.json must be an array");
  assert(Array.isArray(skillTags), "skill_tags.json must be an array");

  console.log("Scraper validation passed.");
  console.log(`Active qualifications: ${qualifications.length}`);
  console.log(`Dropdown items: ${dropdown.length}`);
  console.log(`Fields: ${fields.length}`);
  console.log(`Skill tags: ${skillTags.length}`);

  validateRawScrapedData(raw);
}

main();