import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchTokens(value) {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "in",
    "of",
    "to",
    "a",
    "an",
    "level",
    "nqf",
  ]);

  return normalizeText(value)
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function chooseBestSearchToken(customTitle) {
  const tokens = getSearchTokens(customTitle);

  if (tokens.length === 0) return "";

  const genericQualificationWords = new Set([
    "certificate",
    "diploma",
    "degree",
    "national",
    "higher",
    "advanced",
    "occupational",
    "qualification",
  ]);

  const meaningfulTokens = tokens.filter(
    (token) => !genericQualificationWords.has(token),
  );

  return meaningfulTokens[0] || tokens[0];
}

function similarityScore(input, candidate) {
  const inputTokens = new Set(getSearchTokens(input));
  const candidateTokens = new Set(getSearchTokens(candidate));

  if (inputTokens.size === 0 || candidateTokens.size === 0) return 0;

  let overlap = 0;

  inputTokens.forEach((token) => {
    if (candidateTokens.has(token)) {
      overlap++;
    }
  });

  return overlap / Math.max(inputTokens.size, candidateTokens.size);
}

function getQualificationTitle(data) {
  return data?.title || data?.label || data?.qualification_title || "";
}

function normalizeNqfLevel(value) {
  if (!value) return null;

  const directNumber = Number(value);
  if (Number.isInteger(directNumber)) return directNumber;

  const match = String(value).match(/NQF\s*Level\s*(\d+)|NQF\s*(\d+)/i);
  const level = match ? Number(match[1] || match[2]) : null;

  return Number.isInteger(level) ? level : null;
}

function buildMatchResult({
  status,
  bestMatch = null,
  matches = [],
  matchScore = 0,
  searchToken = "",
  selectedSector = "",
  selectedNqfLevel = null,
  fallbackUsed = false,
}) {
  return {
    status,
    bestMatch,
    matches,
    matchScore,
    fallbackUsed,
    searchedWith: {
      searchToken,
      selectedSector: selectedSector || "",
      selectedNqfLevel,
    },
  };
}

function scoreAndSortMatches(snapshot, customTitle) {
  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const title = getQualificationTitle(data);

      return {
        id: doc.id,
        ...data,
        title,
        matchScore: similarityScore(customTitle, title),
      };
    })
    .filter((item) => item.matchScore >= 0.35)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}

async function runStrictQuery({ searchToken, selectedSector, nqfLevel }) {
  const filters = [where("searchTokens", "array-contains", searchToken)];

  if (selectedSector) {
    filters.push(where("field_name", "==", selectedSector));
  }

  if (nqfLevel) {
    filters.push(where("nqf_level_number", "<=", nqfLevel));
  }

  const saqaQuery = query(
    collection(db, "saqaQualifications"),
    ...filters,
    limit(50),
  );

  return getDocs(saqaQuery);
}

async function runTokenOnlyFallbackQuery(searchToken) {
  const fallbackQuery = query(
    collection(db, "saqaQualifications"),
    where("searchTokens", "array-contains", searchToken),
    limit(50),
  );

  return getDocs(fallbackQuery);
}

export async function verifyQualificationAgainstSaqa(
  customTitle,
  { selectedSector, selectedNqfLevel } = {},
) {
  const searchToken = chooseBestSearchToken(customTitle);
  const nqfLevel = normalizeNqfLevel(selectedNqfLevel);

  if (!searchToken) {
    return buildMatchResult({
      status: "not_found",
      searchToken: "",
      selectedSector,
      selectedNqfLevel: nqfLevel,
    });
  }

  let snapshot;
  let fallbackUsed = false;

  try {
    snapshot = await runStrictQuery({
      searchToken,
      selectedSector,
      nqfLevel,
    });
  } catch (error) {
    console.warn(
      "Strict SAQA qualification query failed. Falling back to token-only search:",
      error,
    );

    fallbackUsed = true;
    snapshot = await runTokenOnlyFallbackQuery(searchToken);
  }

  const matches = scoreAndSortMatches(snapshot, customTitle);
  const bestMatch = matches[0] || null;

  if (!bestMatch) {
    return buildMatchResult({
      status: "not_found",
      searchToken,
      selectedSector,
      selectedNqfLevel: nqfLevel,
      fallbackUsed,
    });
  }

  const status = bestMatch.matchScore >= 0.75 ? "matched" : "possible_match";

  return buildMatchResult({
    status,
    bestMatch,
    matches,
    matchScore: bestMatch.matchScore,
    searchToken,
    selectedSector,
    selectedNqfLevel: nqfLevel,
    fallbackUsed,
  });
}