const cheerio = require("cheerio");
const fs = require("fs");
const { chromium } = require("playwright");

const START_URL = "https://allqs.saqa.org.za/search.php?id=";

// Limit pages for proof of concept. Increase carefully if needed.
const MAX_PAGES = 5;

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

async function scrapePagesWithPlaywright() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const allQualifications = [];

  await page.goto(START_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber++) {
    console.log(`Scraping page ${pageNumber}...`);

    const html = await page.content();
    const pageQualifications = parseQualificationsFromHtml(html);

    console.log(`Found ${pageQualifications.length} qualifications`);

    const first = pageQualifications[0];
    const last = pageQualifications[pageQualifications.length - 1];

    console.log("First qualification on this page:", first?.saqa_id, first?.title);
    console.log("Last qualification on this page:", last?.saqa_id, last?.title);

    allQualifications.push(...pageQualifications);

    if (pageNumber === MAX_PAGES) break;

    const nextOffset = pageNumber * 20;

    console.log(`Moving to next offset: ${nextOffset}`);

    await page.evaluate((offset) => {
      if (typeof goPrevNext === "function") {
        goPrevNext(offset);
      } else {
        throw new Error("goPrevNext function not found on page");
      }
    }, nextOffset);

    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForTimeout(1500);
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
  const scrapedQualifications = await scrapePagesWithPlaywright();
  const allQualifications = dedupeBySaqaId(scrapedQualifications);

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
    scraped_rows_before_dedupe: scrapedQualifications.length,
    unique_qualifications_after_dedupe: allQualifications.length,
    active_qualifications: activeQualifications.length,
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
