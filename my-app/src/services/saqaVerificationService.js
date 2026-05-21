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

function chooseBestSearchToken(customTitle) {
  const tokens = getSearchTokens(customTitle);

  if (tokens.length === 0) return "";

  const priorityWords = tokens.filter(
    (token) =>
      ![
        "certificate",
        "diploma",
        "degree",
        "national",
        "higher",
        "advanced",
      ].includes(token),
  );

  return priorityWords[0] || tokens[0];
}

export async function verifyQualificationAgainstSaqa(
  customTitle,
  { selectedSector, selectedNqfLevel } = {},
) {
  const searchToken = chooseBestSearchToken(customTitle);

  if (!searchToken) {
    return {
      status: "not_found",
      bestMatch: null,
      matches: [],
      matchScore: 0,
    };
  }

  const filters = [
    where("searchTokens", "array-contains", searchToken),
    limit(50),
  ];

  if (selectedSector) {
    filters.unshift(where("field_name", "==", selectedSector));
  }

  if (selectedNqfLevel) {
    filters.unshift(where("nqf_level_number", "<=", Number(selectedNqfLevel)));
  }

  const q = query(collection(db, "saqaQualifications"), ...filters);
  const snapshot = await getDocs(q);

  const matches = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const title = data.title || data.label || "";

      return {
        id: doc.id,
        ...data,
        matchScore: similarityScore(customTitle, title),
      };
    })
    .filter((item) => item.matchScore >= 0.35)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  const bestMatch = matches[0];

  if (!bestMatch) {
    return {
      status: "not_found",
      bestMatch: null,
      matches: [],
      matchScore: 0,
    };
  }

  if (bestMatch.matchScore >= 0.75) {
    return {
      status: "matched",
      bestMatch,
      matches,
      matchScore: bestMatch.matchScore,
    };
  }

  return {
    status: "possible_match",
    bestMatch,
    matches,
    matchScore: bestMatch.matchScore,
  };
}