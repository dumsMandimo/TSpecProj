// Uses the Firebase Admin SDK so the import runs with full permissions,
// bypassing Firestore security rules (correct behaviour for a server script).
//
// Setup:
//   npm install --save-dev firebase-admin
//
// Generate a service account key:
//   Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
//   Save as serviceAccountKey.json in your project root
//   Add serviceAccountKey.json to .gitignore immediately
const path = require("path");
const admin = require("firebase-admin");
const serviceAccount = require(path.resolve(__dirname, "../../serviceAccountKey.json"));

const qualifications = require("../src/data/saqa/qualification_dropdown.json");
const fields = require("../src/data/saqa/fields.json");
const skillTags = require("../src/data/saqa/skill_tags.json");
const scraperReport = require("../src/data/saqa/scraper_report.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

console.log(`Connecting to Firebase project: ${serviceAccount.project_id}`);

function sanitizeId(raw) {
  const str = String(raw ?? "")
    .trim()
    .replace(/\//g, "_")
    .replace(/\s+/g, "-")
    .replace(/[#[\]*?]/g, "");

  if (!str || str === "." || str === "..") {
    throw new Error(`ID "${raw}" sanitises to an illegal value`);
  }
  return str;
}

async function commitInBatches(collectionName, items, getRawId) {
  let batch = db.batch();
  let count = 0;
  let total = 0;
  let skipped = 0;

  for (const item of items) {
    let id;
    try {
      id = sanitizeId(getRawId(item));
    } catch (err) {
      console.error(`Skipping item in ${collectionName}: ${err.message}`);
      skipped++;
      continue;
    }

    const ref = db.collection(collectionName).doc(id);
    batch.set(ref, { ...item, importedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    count++;
    total++;

    if (count === 450) {
      await batch.commit();
      batch = db.batch();
      count = 0;
      console.log(`  Committed ${total} records into ${collectionName}...`);
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(
    `Done: ${total} records → ${collectionName}` +
      (skipped ? ` (${skipped} skipped)` : ""),
  );
}

async function main() {
  console.log("Importing SAQA data to Firestore...\n");

  await commitInBatches("saqaFields", fields, (f) => String(f.field_code));

  await commitInBatches("saqaQualifications", qualifications, (q) =>
    String(q.value),
  );

  await commitInBatches(
    "saqaLearningAreas",
    skillTags,
    (tag) =>
      `${tag.name}-${tag.field_name}-${tag.nqf_level_number}`
        .toLowerCase()
        .replace(/[^\w]+/g, "-"),
  );

  const reportRef = db.collection("saqaMetadata").doc("scraperReport");
  await reportRef.set(
    { ...scraperReport, importedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true },
  );

  console.log("\nSAQA import complete.");
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});