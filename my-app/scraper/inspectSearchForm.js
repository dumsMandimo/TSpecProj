const { chromium } = require("playwright");

const SEARCH_URL = "https://allqs.saqa.org.za/search.php?cat=qual";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(SEARCH_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  const controls = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("input, select, textarea")).map(
      (el) => ({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute("type"),
        name: el.getAttribute("name"),
        id: el.getAttribute("id"),
        value: el.getAttribute("value"),
        options:
          el.tagName.toLowerCase() === "select"
            ? Array.from(el.options).map((option) => ({
                text: option.textContent.trim(),
                value: option.value,
              }))
            : undefined,
      })
    );
  });

  console.dir(controls, { depth: null });

  await browser.close();
}

main().catch((error) => {
  console.error(error);
});