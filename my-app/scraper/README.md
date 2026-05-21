# SAQA Qualification Scraper

This scraper collects public qualification data from SAQA and converts it into app-ready JSON files for the SA Learnerships and Skills Development Portal.

## Purpose

The project brief requires qualification dropdowns and skill tags to be aligned with the South African National Qualifications Framework (NQF). This scraper supports that by extracting SAQA qualification records, including:

- SAQA qualification ID
- qualification title
- NQF level
- field
- learning subfield
- credits
- status
- source URL

## Generated files

- `qualifications_scraped_raw.json`: raw scraped rows before deduplication
- `qualifications_cleaned.json`: unique SAQA qualification records
- `qualifications_active.json`: active usable qualifications
- `qualification_dropdown.json`: dropdown-ready qualification options
- `fields.json`: SAQA fields/sectors
- `skill_tags.json`: skill tags derived from SAQA learning subfields
- `scraper_report.json`: summary report of scraper output

## Run scraper

```bash
node scrapeQualifications.js
```
