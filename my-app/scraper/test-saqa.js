const axios = require("axios");
const cheerio = require("cheerio");

const URL = "https://allqs.saqa.org.za/search.php?id=";

async function testScrape() {
  const { data } = await axios.get(URL, {
    headers: {
      "User-Agent": "UbuntuCareers student project scraper",
    },
  });

  const $ = cheerio.load(data);

  console.log("Page title/text sample:");
  console.log($("body").text().slice(0, 500));

  console.log("\nRows found:", $("tr").length);

  $("tr").slice(0, 5).each((i, row) => {
    const cells = $(row)
      .find("td")
      .map((_, cell) => $(cell).text().trim().replace(/\s+/g, " "))
      .get();

    console.log(`Row ${i}:`, cells);
  });
}

testScrape().catch(console.error);