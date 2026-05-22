import { verifyQualificationAgainstSaqa } from "./saqaVerificationService";
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";

jest.mock("../firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
}));

function createSnapshot(docs) {
  return {
    docs: docs.map(({ id, data }) => ({
      id: id || "doc1",
      data: () => data,
    })),
  };
}

describe("saqaVerificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    collection.mockReturnValue("mockCollection");
    query.mockReturnValue("mockQuery");
    where.mockImplementation((field, op, value) => ({ field, op, value }));
    limit.mockReturnValue("mockLimit");
  });

  test("returns not_found when no usable search token can be built", async () => {
    const result = await verifyQualificationAgainstSaqa("a in of", {
      selectedSector: "Technology",
      selectedNqfLevel: 6,
    });

    expect(result).toEqual({
      status: "not_found",
      bestMatch: null,
      matches: [],
      matchScore: 0,
      fallbackUsed: false,
      searchedWith: {
        searchToken: "",
        selectedSector: "Technology",
        selectedNqfLevel: 6,
      },
    });

    expect(getDocs).not.toHaveBeenCalled();
  });

  test("returns matched when best match score is at least 0.75", async () => {
    getDocs.mockResolvedValue(
      createSnapshot([
        {
          id: "saqa1",
          data: {
            title: "Software Development Diploma",
            field_name: "Technology",
            nqf_level_number: 6,
            searchTokens: ["software"],
          },
        },
      ])
    );

    const result = await verifyQualificationAgainstSaqa(
      "Software Development Diploma",
      { selectedSector: "Technology", selectedNqfLevel: 6 }
    );

    expect(result.status).toBe("matched");
    expect(result.bestMatch).toMatchObject({
      id: "saqa1",
      title: "Software Development Diploma",
    });
    expect(result.matchScore).toBeGreaterThanOrEqual(0.75);
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.fallbackUsed).toBe(false);
    expect(getDocs).toHaveBeenCalledTimes(1);
  });

  test("returns possible_match when score is between 0.35 and 0.75", async () => {
    getDocs.mockResolvedValue(
      createSnapshot([
        {
          id: "saqa2",
          data: {
            title: "Software Development Basics",
            searchTokens: ["software"],
          },
        },
      ])
    );

    const result = await verifyQualificationAgainstSaqa(
      "Software Development Advanced Programming",
      { selectedSector: "", selectedNqfLevel: null }
    );

    expect(result.status).toBe("possible_match");
    expect(result.bestMatch).toBeTruthy();
    expect(result.matchScore).toBeGreaterThanOrEqual(0.35);
    expect(result.matchScore).toBeLessThan(0.75);
  });

  test("returns not_found when Firestore returns no strong matches", async () => {
    getDocs.mockResolvedValue(
      createSnapshot([
        {
          id: "saqa3",
          data: {
            title: "Completely Different Agriculture Qualification",
            searchTokens: ["agriculture"],
          },
        },
      ])
    );

    const result = await verifyQualificationAgainstSaqa(
      "Software Development Diploma",
      { selectedSector: "Technology", selectedNqfLevel: 6 }
    );

    expect(result.status).toBe("not_found");
    expect(result.bestMatch).toBeNull();
    expect(result.matches).toEqual([]);
    expect(result.matchScore).toBe(0);
  });

  test("returns not_found when Firestore returns no documents", async () => {
    getDocs.mockResolvedValue(createSnapshot([]));

    const result = await verifyQualificationAgainstSaqa(
      "Software Development Diploma",
      { selectedSector: "Technology", selectedNqfLevel: 6 }
    );

    expect(result.status).toBe("not_found");
    expect(result.bestMatch).toBeNull();
    expect(result.matches).toEqual([]);
  });

  test("uses strict query filters for sector and parsed NQF level", async () => {
    getDocs.mockResolvedValue(createSnapshot([]));

    await verifyQualificationAgainstSaqa("Software Development Diploma", {
      selectedSector: "Technology",
      selectedNqfLevel: "NQF Level 6",
    });

    expect(where).toHaveBeenCalledWith("searchTokens", "array-contains", "software");
    expect(where).toHaveBeenCalledWith("field_name", "==", "Technology");
    expect(where).toHaveBeenCalledWith("nqf_level_number", "<=", 6);
    expect(limit).toHaveBeenCalledWith(50);
    expect(collection).toHaveBeenCalledWith({}, "saqaQualifications");
  });

  test("falls back to token-only query when strict query fails", async () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    getDocs
      .mockRejectedValueOnce(new Error("Firestore index missing"))
      .mockResolvedValueOnce(
        createSnapshot([
          {
            id: "saqa4",
            data: {
              label: "Software Development Diploma",
              searchTokens: ["software"],
            },
          },
        ])
      );

    const result = await verifyQualificationAgainstSaqa(
      "Software Development Diploma",
      { selectedSector: "Technology", selectedNqfLevel: 6 }
    );

    expect(getDocs).toHaveBeenCalledTimes(2);
    expect(result.fallbackUsed).toBe(true);
    expect(result.status).toBe("matched");
    expect(result.bestMatch.title).toBe("Software Development Diploma");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Strict SAQA qualification query failed. Falling back to token-only search:",
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });

  test("uses label when title is missing on qualification records", async () => {
    getDocs.mockResolvedValue(
      createSnapshot([
        {
          id: "saqa5",
          data: {
            label: "Occupational Certificate: Software Developer",
            searchTokens: ["software"],
          },
        },
      ])
    );

    const result = await verifyQualificationAgainstSaqa(
      "Software Developer Occupational Certificate",
      { selectedSector: "", selectedNqfLevel: null }
    );

    expect(result.bestMatch.title).toBe(
      "Occupational Certificate: Software Developer"
    );
    expect(result.status).toMatch(/matched|possible_match/);
  });

  test("includes searchedWith metadata in the result", async () => {
    getDocs.mockResolvedValue(createSnapshot([]));

    const result = await verifyQualificationAgainstSaqa(
      "Software Development Diploma",
      { selectedSector: "Technology", selectedNqfLevel: 6 }
    );

    expect(result.searchedWith).toEqual({
      searchToken: "software",
      selectedSector: "Technology",
      selectedNqfLevel: 6,
    });
  });

  test("limits ranked matches to top 5 results", async () => {
    getDocs.mockResolvedValue(
      createSnapshot(
        Array.from({ length: 8 }, (_, index) => ({
          id: `saqa-${index}`,
          data: {
            title: `Software Development Qualification ${index}`,
            searchTokens: ["software"],
          },
        }))
      )
    );

    const result = await verifyQualificationAgainstSaqa(
      "Software Development Diploma",
      { selectedSector: "", selectedNqfLevel: null }
    );

    expect(result.matches.length).toBeLessThanOrEqual(5);
  });
});