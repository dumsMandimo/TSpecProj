const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const START_URL = "https://allqs.saqa.org.za/search.php?id=";

// Keep this as 1 until pagination is working properly.
const MAX_PAGES = 1;

function clean(text) {
  return text.replace(/\s+/g, " ").trim();
}

function emptyToNull(value) {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

function makeAbsoluteUrl(href) {
  if (!href) return null;

  if (href.startsWith("http")) {
    return href;
  }

  return new URL(href, START_URL).href;
}

function parseNqfLevel(nqfLevelText, pre2009Text) {
  const combined = `${nqfLevelText || ""} ${pre2009Text || ""}`;

  const match =
    combined.match(/NQF\s*Level\s*0?(\d+)/i) ||
    combined.match(/\bLevel\s*0?(\d+)\b/i) ||
    combined.match(/\bL\s*0?(\d+)\b/i);

  return match ? Number(match[1]) : null;
}

function parseField(fieldText) {
  if (!fieldText) {
    return {
      field_code: null,
      field_name: null,
    };
  }

  const match = fieldText.match(/^Field\s+(\d+)\s+-\s+(.+)$/i);

  return {
    field_code: match ? match[1] : null,
    field_name: match ? match[2] : fieldText,
  };
}

function parseCredits(value) {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function isActiveStatus(status) {
  if (!status) return null;

  const lowerStatus = status.toLowerCase();

  return (
    !lowerStatus.includes("passed the end date") &&
    !lowerStatus.includes("historical")
  );
}

function makeDropdownLabel(qualification) {
  return `${qualification.title} — NQF Level ${qualification.nqf_level_number}`;
}

function makeSearchText(qualification) {
  return [
    qualification.title,
    qualification.field_name,
    qualification.learning_subfield,
    qualification.nqf_level_text,
    qualification.originator,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

async function scrapePage(url) {
  console.log(`Scraping: ${url}`);

  const { data: html } = await axios.get(url, {
    headers: {
      "User-Agent": "UbuntuCareers student project scraper",
    },
  });

  const $ = cheerio.load(html);
  const qualifications = [];

  $("tr").each((index, row) => {
    const cells = $(row)
      .find("td")
      .map((_, cell) => clean($(cell).text()))
      .get();

    if (cells.length < 10) return;

    const saqaId = cells[0];

    // Skip heading rows and invalid rows
    if (!/^\d+$/.test(saqaId)) return;

    const links = $(row)
      .find("a[href]")
      .map((_, link) => $(link).attr("href"))
      .get();

    const selfLink = links.find((href) => href.includes(`id=${saqaId}`));

    const field = parseField(cells[8]);

    const qualification = {
      // Core SAQA data
      saqa_id: saqaId,
      title: emptyToNull(cells[1]),

      // NQF alignment
      pre_2009_nqf_level_text: emptyToNull(cells[2]),
      nqf_level_text: emptyToNull(cells[3]),
      nqf_level_number: parseNqfLevel(cells[3], cells[2]),

      // Classification data for dropdowns and filtering
      abet_band: emptyToNull(cells[4]),
      learning_subfield: emptyToNull(cells[5]),
      nqf_subframework: emptyToNull(cells[6]),
      originator: emptyToNull(cells[7]),
      field_code: field.field_code,
      field_name: field.field_name,

      // Credits and status
      min_credits: parseCredits(cells[9]),
      status: emptyToNull(cells[10]),
      is_active: isActiveStatus(cells[10]),

      // Extra SAQA info
      qa_functionary: emptyToNull(cells[11]),
      is_learning_programme: cells[12] === "Yes",
      recorded_against_qualification_id: emptyToNull(cells[13]),

      // Source tracking for project justification
      source: "SAQA",
      source_url: selfLink
        ? makeAbsoluteUrl(selfLink)
        : `https://allqs.saqa.org.za/showQualification.php?id=${saqaId}`,

      scraped_at: new Date().toISOString(),
    };

    // App-specific helper fields
    qualification.dropdown_label = makeDropdownLabel(qualification);
    qualification.search_text = makeSearchText(qualification);

    qualifications.push(qualification);
  });

  return qualifications;
}

function buildProjectOutputs(allQualifications) {
  // For the app, use active qualifications with valid NQF levels.
  const activeQualifications = allQualifications.filter(
    (q) => q.is_active && q.nqf_level_number !== null
  );

  const qualificationDropdown = activeQualifications.map((q) => ({
    value: q.saqa_id,
    label: q.dropdown_label,
    title: q.title,
    nqf_level_number: q.nqf_level_number,
    field_name: q.field_name,
    learning_subfield: q.learning_subfield,
    min_credits: q.min_credits,
    source_url: q.source_url,
  }));

  const nqfLevels = [
    ...new Set(
      activeQualifications
        .map((q) => q.nqf_level_number)
        .filter((level) => level !== null)
    ),
  ]
    .sort((a, b) => a - b)
    .map((level) => ({
      value: level,
      label: `NQF Level ${level}`,
    }));

  const fields = Array.from(
    new Map(
      activeQualifications
        .filter((q) => q.field_code && q.field_name)
        .map((q) => [
          q.field_code,
          {
            field_code: q.field_code,
            field_name: q.field_name,
          },
        ])
    ).values()
  ).sort((a, b) => a.field_code.localeCompare(b.field_code));

  const skillTagsMap = new Map();

  activeQualifications.forEach((q) => {
    if (!q.learning_subfield || !q.field_name || !q.nqf_level_number) return;

    const key = `${q.learning_subfield}-${q.field_name}-${q.nqf_level_number}`;

    if (!skillTagsMap.has(key)) {
      skillTagsMap.set(key, {
        name: q.learning_subfield,
        field_name: q.field_name,
        field_code: q.field_code,
        nqf_level_number: q.nqf_level_number,
        source: "Derived from SAQA qualification learning subfield",
        example_qualification_id: q.saqa_id,
        example_qualification_title: q.title,
        source_url: q.source_url,
      });
    }
  });

  const skillTags = Array.from(skillTagsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return {
    activeQualifications,
    qualificationDropdown,
    nqfLevels,
    fields,
    skillTags,
  };
}

async function main() {
  let allQualifications = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const pageQualifications = await scrapePage(START_URL);
    allQualifications = allQualifications.concat(pageQualifications);
  }

  const {
    activeQualifications,
    qualificationDropdown,
    nqfLevels,
    fields,
    skillTags,
  } = buildProjectOutputs(allQualifications);

  fs.writeFileSync(
    "qualifications_raw.json",
    JSON.stringify(allQualifications, null, 2)
  );

  fs.writeFileSync(
    "qualifications_active.json",
    JSON.stringify(activeQualifications, null, 2)
  );

  fs.writeFileSync(
    "qualification_dropdown.json",
    JSON.stringify(qualificationDropdown, null, 2)
  );

  fs.writeFileSync("nqf_levels.json", JSON.stringify(nqfLevels, null, 2));

  fs.writeFileSync("fields.json", JSON.stringify(fields, null, 2));

  fs.writeFileSync("skill_tags.json", JSON.stringify(skillTags, null, 2));

  console.log("Summary:");
  console.log(`Total scraped qualifications: ${allQualifications.length}`);
  console.log(`Active qualifications: ${activeQualifications.length}`);
  console.log(`Qualification dropdown items: ${qualificationDropdown.length}`);
  console.log(`NQF levels found: ${nqfLevels.length}`);
  console.log(`Fields found: ${fields.length}`);
  console.log(`Skill tags generated: ${skillTags.length}`);

  console.log("Done. Project-ready files created.");
}

main().catch((error) => {
  console.error("Scraper failed:", error.message);
});