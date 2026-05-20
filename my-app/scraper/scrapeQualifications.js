const cheerio = require("cheerio");
const fs = require("fs");
const { chromium } = require("playwright");

const START_URL = "https://allqs.saqa.org.za/search.php?id=";

const SEARCH_URL = "https://allqs.saqa.org.za/search.php?cat=qual";

const SCRAPER_MODE = process.env.SCRAPER_MODE || "demo";

const SCRAPER_CONFIGS = {
  demo: {
    delayMs: 1500,
    description: "Safe targeted demo mode for project proof of concept",
  },
  expanded: {
    delayMs: 2500,
    description: "Expanded targeted mode for broader coverage",
  },
};

const CONFIG = SCRAPER_CONFIGS[SCRAPER_MODE];

if (!CONFIG) {
  throw new Error(
    `Invalid SCRAPER_MODE "${SCRAPER_MODE}". Use "demo" or "expanded".`
  );
}

const NQF_LEVEL_VALUES = {
  1: "503",
  2: "504",
  3: "505",
  4: "506",
  5: "507",
  6: "508",
  7: "509",
  8: "510",
  9: "511",
  10: "512",
};

const QUALIFICATION_TYPE_VALUES = {
  GENERAL_CERTIFICATE: "743",
  ELEMENTARY_CERTIFICATE: "742",
  INTERMEDIATE_CERTIFICATE: "741",
  NATIONAL_CERTIFICATE: "2",
  HIGHER_CERTIFICATE: "680",
  DIPLOMA_240: "720",
  DIPLOMA_360: "698",
  ADVANCED_CERTIFICATE: "678",
  ADVANCED_DIPLOMA: "679",
  BACHELORS_DEGREE: "4",
  HONOURS_DEGREE: "509",
  POSTGRADUATE_DIPLOMA: "533",
  MASTERS_DEGREE: "505",
  DOCTORAL_DEGREE: "503",
};

const FIELD_VALUES = {
  AGRICULTURE: "1",
  CULTURE_AND_ARTS: "2",
  BUSINESS: "3",
  COMMUNICATION: "4",
  EDUCATION: "5",
  ENGINEERING: "6",
  HUMAN_SOCIAL_STUDIES: "7",
  LAW_SECURITY: "8",
  HEALTH: "9",
  SCIENCE_COMPUTER: "10",
  SERVICES: "11",
  CONSTRUCTION: "12",
};

const SEARCH_TARGETS = [
  {
    label: "NQF 1 General Certificate - Services",
    nqfLevel: 1,
    nqfLevelValue: NQF_LEVEL_VALUES[1],
    qualificationType: "General Certificate",
    qualificationTypeValue: QUALIFICATION_TYPE_VALUES.GENERAL_CERTIFICATE,
    field: "Services",
    fieldValue: FIELD_VALUES.SERVICES,
    maxPages: 1,
  },
  {
    label: "NQF 2 Elementary Certificate - Agriculture",
    nqfLevel: 2,
    nqfLevelValue: NQF_LEVEL_VALUES[2],
    qualificationType: "Elementary Certificate",
    qualificationTypeValue: QUALIFICATION_TYPE_VALUES.ELEMENTARY_CERTIFICATE,
    field: "Agriculture and Nature Conservation",
    fieldValue: FIELD_VALUES.AGRICULTURE,
    maxPages: 1,
  },
  {
    label: "NQF 3 Intermediate Certificate - Engineering",
    nqfLevel: 3,
    nqfLevelValue: NQF_LEVEL_VALUES[3],
    qualificationType: "Intermediate Certificate",
    qualificationTypeValue: QUALIFICATION_TYPE_VALUES.INTERMEDIATE_CERTIFICATE,
    field: "Manufacturing, Engineering and Technology",
    fieldValue: FIELD_VALUES.ENGINEERING,
    maxPages: 1,
  },
  {
    label: "NQF 4 National Certificate - Computer Science",
    nqfLevel: 4,
    nqfLevelValue: NQF_LEVEL_VALUES[4],
    qualificationType: "National Certificate",
    qualificationTypeValue: QUALIFICATION_TYPE_VALUES.NATIONAL_CERTIFICATE,
    field: "Physical, Mathematical, Computer and Life Sciences",
    fieldValue: FIELD_VALUES.SCIENCE_COMPUTER,
    maxPages: 2,
  },
  {
    label: "NQF 5 Higher Certificate - Business",
    nqfLevel: 5,
    nqfLevelValue: NQF_LEVEL_VALUES[5],
    qualificationType: "Higher Certificate",
    qualificationTypeValue: QUALIFICATION_TYPE_VALUES.HIGHER_CERTIFICATE,
    field: "Business, Commerce and Management Studies",
    fieldValue: FIELD_VALUES.BUSINESS,
    maxPages: 2,
  },
  {
    label: "NQF 6 Diploma - Engineering",
    nqfLevel: 6,
    nqfLevelValue: NQF_LEVEL_VALUES[6],
    qualificationType: "Diploma",
    qualificationTypeValue: QUALIFICATION_TYPE_VALUES.DIPLOMA_360,
    field: "Manufacturing, Engineering and Technology",
    fieldValue: FIELD_VALUES.ENGINEERING,
    maxPages: 2,
  },
  {
    label: "NQF 6 Advanced Certificate - Business",
    nqfLevel: 6,
    nqfLevelValue: NQF_LEVEL_VALUES[6],
    qualificationType: "Advanced Certificate",
    qualificationTypeValue: QUALIFICATION_TYPE_VALUES.ADVANCED_CERTIFICATE,
    field: "Business, Commerce and Management Studies",
    fieldValue: FIELD_VALUES.BUSINESS,
    maxPages: 2,
  },
  {
    label: "NQF 7 Bachelor's Degree - Health",
    nqfLevel: 7,
    nqfLevelValue: NQF_LEVEL_VALUES[7],
    qualificationType: "Bachelor's Degree",
    qualificationTypeValue: QUALIFICATION_TYPE_VALUES.BACHELORS_DEGREE,
    field: "Health Sciences and Social Services",
    fieldValue: FIELD_VALUES.HEALTH,
    maxPages: 2,
  },
  {
    label: "NQF 7 Advanced Diploma - Education",
    nqfLevel: 7,
    nqfLevelValue: NQF_LEVEL_VALUES[7],
    qualificationType: "Advanced Diploma",
    qualificationTypeValue: QUALIFICATION_TYPE_VALUES.ADVANCED_DIPLOMA,
    field: "Education, Training and Development",
    fieldValue: FIELD_VALUES.EDUCATION,
    maxPages: 2,
  },
  {
    label: "NQF 8 Honours Degree - Science",
    nqfLevel: 8,
    nqfLevelValue: NQF_LEVEL_VALUES[8],
    qualificationType: "Honours Degree",
    qualificationTypeValue: QUALIFICATION_TYPE_VALUES.HONOURS_DEGREE,
    field: "Physical, Mathematical, Computer and Life Sciences",
    fieldValue: FIELD_VALUES.SCIENCE_COMPUTER,
    maxPages: 2,
  },
  {
    label: "NQF 8 Postgraduate Diploma - Business",
    nqfLevel: 8,
    nqfLevelValue: NQF_LEVEL_VALUES[8],
    qualificationType: "Postgraduate Diploma",
    qualificationTypeValue: QUALIFICATION_TYPE_VALUES.POSTGRADUATE_DIPLOMA,
    field: "Business, Commerce and Management Studies",
    fieldValue: FIELD_VALUES.BUSINESS,
    maxPages: 2,
  },
  {
    label: "NQF 9 Master's Degree - Education",
    nqfLevel: 9,
    nqfLevelValue: NQF_LEVEL_VALUES[9],
    qualificationType: "Master's Degree",
    qualificationTypeValue: QUALIFICATION_TYPE_VALUES.MASTERS_DEGREE,
    field: "Education, Training and Development",
    fieldValue: FIELD_VALUES.EDUCATION,
    maxPages: 2,
  },
  {
    label: "NQF 10 Doctoral Degree - Science",
    nqfLevel: 10,
    nqfLevelValue: NQF_LEVEL_VALUES[10],
    qualificationType: "Doctoral Degree",
    qualificationTypeValue: QUALIFICATION_TYPE_VALUES.DOCTORAL_DEGREE,
    field: "Physical, Mathematical, Computer and Life Sciences",
    fieldValue: FIELD_VALUES.SCIENCE_COMPUTER,
    maxPages: 2,
  },
];

const SECTOR_TARGETS = [
  {
    label: "Sector - Agriculture and Nature Conservation",
    field: "Agriculture and Nature Conservation",
    fieldValue: FIELD_VALUES.AGRICULTURE,
    maxPages: 1,
  },
  {
    label: "Sector - Culture and Arts",
    field: "Culture and Arts",
    fieldValue: FIELD_VALUES.CULTURE_AND_ARTS,
    maxPages: 1,
  },
  {
    label: "Sector - Business, Commerce and Management Studies",
    field: "Business, Commerce and Management Studies",
    fieldValue: FIELD_VALUES.BUSINESS,
    maxPages: 1,
  },
  {
    label: "Sector - Communication Studies and Language",
    field: "Communication Studies and Language",
    fieldValue: FIELD_VALUES.COMMUNICATION,
    maxPages: 1,
  },
  {
    label: "Sector - Education, Training and Development",
    field: "Education, Training and Development",
    fieldValue: FIELD_VALUES.EDUCATION,
    maxPages: 1,
  },
  {
    label: "Sector - Manufacturing, Engineering and Technology",
    field: "Manufacturing, Engineering and Technology",
    fieldValue: FIELD_VALUES.ENGINEERING,
    maxPages: 1,
  },
  {
    label: "Sector - Human and Social Studies",
    field: "Human and Social Studies",
    fieldValue: FIELD_VALUES.HUMAN_SOCIAL_STUDIES,
    maxPages: 1,
  },
  {
    label: "Sector - Law, Military Science and Security",
    field: "Law, Military Science and Security",
    fieldValue: FIELD_VALUES.LAW_SECURITY,
    maxPages: 1,
  },
  {
    label: "Sector - Health Sciences and Social Services",
    field: "Health Sciences and Social Services",
    fieldValue: FIELD_VALUES.HEALTH,
    maxPages: 1,
  },
  {
    label: "Sector - Physical, Mathematical, Computer and Life Sciences",
    field: "Physical, Mathematical, Computer and Life Sciences",
    fieldValue: FIELD_VALUES.SCIENCE_COMPUTER,
    maxPages: 1,
  },
  {
    label: "Sector - Services",
    field: "Services",
    fieldValue: FIELD_VALUES.SERVICES,
    maxPages: 1,
  },
  {
    label: "Sector - Physical Planning and Construction",
    field: "Physical Planning and Construction",
    fieldValue: FIELD_VALUES.CONSTRUCTION,
    maxPages: 1,
  },
];


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

function getSectorSearchAttempt(target) {
  return {
    label: target.label,
    nqfLevelValue: "",
    qualificationTypeValue: "",
    fieldValue: target.fieldValue,
  };
}

function getSearchAttempts(target) {
  return [
    {
      label: `${target.label} — strict`,
      nqfLevelValue: target.nqfLevelValue,
      qualificationTypeValue: target.qualificationTypeValue,
      fieldValue: target.fieldValue,
    },
    {
      label: `${target.label} — NQF + qualification type`,
      nqfLevelValue: target.nqfLevelValue,
      qualificationTypeValue: target.qualificationTypeValue,
      fieldValue: "",
    },
    {
      label: `${target.label} — NQF + field`,
      nqfLevelValue: target.nqfLevelValue,
      qualificationTypeValue: "",
      fieldValue: target.fieldValue,
    },
    {
      label: `${target.label} — NQF only`,
      nqfLevelValue: target.nqfLevelValue,
      qualificationTypeValue: "",
      fieldValue: "",
    },
  ];
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

function parseQualificationsFromHtml(html) {
  const $ = cheerio.load(html);
  const qualifications = [];

  $("tr").each((index, row) => {
    const cells = $(row)
      .find("td")
      .map((_, cell) => clean($(cell).text()))
      .get();

    if (cells.length < 10) return;

    const saqaId = cells[0];

    // Skip heading rows and invalid rows.
    if (!/^\d+$/.test(saqaId)) return;

    const links = $(row)
      .find("a[href]")
      .map((_, link) => $(link).attr("href"))
      .get();

    const selfLink = links.find((href) => href.includes(`id=${saqaId}`));
    const field = parseField(cells[8]);

    const qualification = {
      saqa_id: saqaId,
      title: emptyToNull(cells[1]),

      pre_2009_nqf_level_text: emptyToNull(cells[2]),
      nqf_level_text: emptyToNull(cells[3]),
      nqf_level_number: parseNqfLevel(cells[3], cells[2]),

      abet_band: emptyToNull(cells[4]),
      learning_subfield: emptyToNull(cells[5]),
      nqf_subframework: emptyToNull(cells[6]),
      originator: emptyToNull(cells[7]),

      field_code: field.field_code,
      field_name: field.field_name,

      min_credits: parseCredits(cells[9]),
      status: emptyToNull(cells[10]),
      is_active: isActiveStatus(cells[10]),

      qa_functionary: emptyToNull(cells[11]),
      is_learning_programme: cells[12] === "Yes",
      recorded_against_qualification_id: emptyToNull(cells[13]),

      source: "SAQA",
      source_url: selfLink
        ? makeAbsoluteUrl(selfLink)
        : `https://allqs.saqa.org.za/showQualification.php?id=${saqaId}`,

      scraped_at: new Date().toISOString(),
    };

    qualification.dropdown_label = makeDropdownLabel(qualification);
    qualification.search_text = makeSearchText(qualification);

    qualifications.push(qualification);
  });

  return qualifications;
}

async function applySearchAttempt(page, attempt) {
  await page.goto(SEARCH_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page.selectOption(
    'select[name="NQF_LEVEL_G2_ID"]',
    attempt.nqfLevelValue || ""
  );

  await page.selectOption(
    'select[name="QUALIFICATION_TYPE_ID"]',
    attempt.qualificationTypeValue || ""
  );

  await page.selectOption(
    'select[name="FIELD_ID"]',
    attempt.fieldValue || ""
  );

  await Promise.all([
    page.waitForLoadState("domcontentloaded").catch(() => {}),
    page.click('input[name="GO"]'),
  ]);

  await page.waitForTimeout(CONFIG.delayMs);
}

async function scrapeSectorPages(page, target) {
  const sectorQualifications = [];

  console.log(`\nSector target: ${target.label}`);

  const attempt = getSectorSearchAttempt(target);

  await applySearchAttempt(page, attempt);

  for (let pageNumber = 1; pageNumber <= target.maxPages; pageNumber++) {
    console.log(`Scraping sector page ${pageNumber}...`);

    const html = await page.content();

    const pageQualifications = parseQualificationsFromHtml(html).map((q) => ({
      ...q,
      target_label: target.label,
      target_field: target.field,
      target_type: "sector_coverage",
    }));

    console.log(`Found ${pageQualifications.length} qualifications`);

    const first = pageQualifications[0];
    const last = pageQualifications[pageQualifications.length - 1];

    console.log("First:", first?.saqa_id, first?.title);
    console.log("Last:", last?.saqa_id, last?.title);

    sectorQualifications.push(...pageQualifications);

    if (pageNumber === target.maxPages) break;

    const nextOffset = pageNumber * 20;

    await page.evaluate((offset) => {
      if (typeof goPrevNext === "function") {
        goPrevNext(offset);
      }
    }, nextOffset);

    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForTimeout(CONFIG.delayMs);
  }

  return sectorQualifications;
}

async function scrapeTargetPages(page, target) {
  const targetQualifications = [];

  console.log(`\nTarget: ${target.label}`);

const attempts = getSearchAttempts(target);
let selectedAttempt = null;
let firstPageQualifications = [];

for (const attempt of attempts) {
  console.log(`Trying: ${attempt.label}`);

  await applySearchAttempt(page, attempt);

  const html = await page.content();
  firstPageQualifications = parseQualificationsFromHtml(html);

  console.log(`Found ${firstPageQualifications.length} qualifications`);

  if (firstPageQualifications.length > 0) {
    selectedAttempt = attempt;
    break;
  }
}

if (!selectedAttempt) {
  console.warn(`No qualifications found for target: ${target.label}`);
  return [];
}

console.log(`Using search attempt: ${selectedAttempt.label}`);

for (let pageNumber = 1; pageNumber <= target.maxPages; pageNumber++) {
    console.log(`Scraping target page ${pageNumber}...`);

    const html = await page.content();
    const pageQualifications = parseQualificationsFromHtml(html).map((q) => ({
      ...q,
      target_label: target.label,
      target_nqf_level: target.nqfLevel,
      target_qualification_type: target.qualificationType,
      target_field: target.field,
    }));

    console.log(`Found ${pageQualifications.length} qualifications`);

    const first = pageQualifications[0];
    const last = pageQualifications[pageQualifications.length - 1];

    console.log("First:", first?.saqa_id, first?.title);
    console.log("Last:", last?.saqa_id, last?.title);

    targetQualifications.push(...pageQualifications);

    if (pageNumber === target.maxPages) break;

    const nextOffset = pageNumber * 20;

    await page.evaluate((offset) => {
      if (typeof goPrevNext === "function") {
        goPrevNext(offset);
      }
    }, nextOffset);

    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForTimeout(CONFIG.delayMs);
  }

  return targetQualifications;
}

async function scrapePagesWithPlaywright() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const allQualifications = [];

  console.log("\nScraping NQF and qualification type targets...");

  for (const target of SEARCH_TARGETS) {
    try {
      const targetResults = await scrapeTargetPages(page, target);
      allQualifications.push(...targetResults);
    } catch (error) {
      console.error(`Failed target "${target.label}":`, error.message);
    }
  }

  console.log("\nScraping all 12 SAQA sector targets...");

  for (const target of SECTOR_TARGETS) {
    try {
      const sectorResults = await scrapeSectorPages(page, target);
      allQualifications.push(...sectorResults);
    } catch (error) {
      console.error(`Failed sector "${target.label}":`, error.message);
    }
  }

  await browser.close();

  return allQualifications;
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

function dedupeBySaqaId(qualifications) {
  const map = new Map();

  qualifications.forEach((q) => {
    if (!q.saqa_id) return;

    if (!map.has(q.saqa_id)) {
      map.set(q.saqa_id, q);
    }
  });

  return Array.from(map.values());
}

async function main() {
  console.log(`Running scraper in ${SCRAPER_MODE} mode`);
  console.log(CONFIG.description);
  console.log(`Delay between pages: ${CONFIG.delayMs}ms`);

  const scrapedQualifications = await scrapePagesWithPlaywright();
  const allQualifications = dedupeBySaqaId(scrapedQualifications);

  if (allQualifications.length === 0) {
    throw new Error(
      "Scraper found 0 qualifications. Stopping before overwriting output files."
    );
  }

  console.log(`Scraped rows before dedupe: ${scrapedQualifications.length}`);
  console.log(`Unique qualifications after dedupe: ${allQualifications.length}`);
  
  const {
    activeQualifications,
    qualificationDropdown,
    nqfLevels,
    fields,
    skillTags,
  } = buildProjectOutputs(allQualifications);

  const report = {
    sector_targets_used: SECTOR_TARGETS.map((target) => target.label),
  scraper_mode: SCRAPER_MODE,
  delay_ms: CONFIG.delayMs,
  search_targets_used: SEARCH_TARGETS.map((target) => target.label),
  scraped_rows_before_dedupe: scrapedQualifications.length,
  unique_qualifications_after_dedupe: allQualifications.length,
  active_qualificationpmns: activeQualifications.length,
  dropdown_items: qualificationDropdown.length,
  fields_found: fields.length,
  skill_tags_generated: skillTags.length,
  nqf_levels_in_scraped_active_data: nqfLevels.map((level) => level.value),
  note:
      "Canonical NQF 1-10 levels are handled separately in the application. Scraped SAQA data is used for specific qualification titles, fields, subfields, source URLs, and skill-tag generation.",
    generated_at: new Date().toISOString(),
  };

  fs.writeFileSync(
    "qualifications_scraped_raw.json",
    JSON.stringify(scrapedQualifications, null, 2)
  );

  fs.writeFileSync(
    "qualifications_cleaned.json",
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
  fs.writeFileSync("scraper_report.json", JSON.stringify(report, null, 2));

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
