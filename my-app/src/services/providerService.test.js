import {
  getProviderStats,
  createOpportunity,
  updateApplicationStatus,
} from "./providerService";

// Mock the firebase module so no real network calls are made
jest.mock("./firebase", () => ({
  db: {},
}));

// Mock all firestore functions used by providerService
jest.mock("firebase/firestore", () => ({
  collection:      jest.fn(),
  query:           jest.fn(),
  where:           jest.fn(),
  onSnapshot:      jest.fn(),
  addDoc:          jest.fn(),
  updateDoc:       jest.fn(),
  doc:             jest.fn(),
  getDoc:          jest.fn(),
  getDocs:         jest.fn(),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
}));

const {
  getDocs,
  addDoc,
  updateDoc,
  doc,
  collection,
  query,
  where,
  onSnapshot,
} = require("firebase/firestore");

describe("providerService", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getProviderStats ────────────────────────────────────────────

  describe("getProviderStats", () => {
    it("returns zero counts when provider has no listings", async () => {
      getDocs.mockResolvedValueOnce({ docs: [], size: 0 });

      const result = await getProviderStats("uid-123");

      expect(result).toEqual({
        listings:     0,
        applications: 0,
        shortlisted:  0,
        accepted:     0,
      });
    });

    it("returns correct counts when listings and applications exist", async () => {
      // First getDocs call — listings
      getDocs.mockResolvedValueOnce({
        docs: [
          { id: "listing-1" },
          { id: "listing-2" },
        ],
        size: 2,
      });

      // Second getDocs call — applications chunk
      getDocs.mockResolvedValueOnce({
        size: 3,
        forEach: (cb) => {
          cb({ data: () => ({ status: "shortlisted" }) });
          cb({ data: () => ({ status: "accepted" }) });
          cb({ data: () => ({ status: "received" }) });
        },
      });

      const result = await getProviderStats("uid-123");

      expect(result).toEqual({
        listings:     2,
        applications: 3,
        shortlisted:  1,
        accepted:     1,
      });
    });

    it("handles multiple chunks when provider has more than 30 listings", async () => {
      const manyListings = Array.from({ length: 35 }, (_, i) => ({ id: `listing-${i}` }));

      getDocs.mockResolvedValueOnce({ docs: manyListings, size: 35 });

      // Two chunks: first 30, then 5
      getDocs.mockResolvedValueOnce({
        size: 10,
        forEach: (cb) => {
          for (let i = 0; i < 10; i++) cb({ data: () => ({ status: "received" }) });
        },
      });
      getDocs.mockResolvedValueOnce({
        size: 2,
        forEach: (cb) => {
          cb({ data: () => ({ status: "accepted" }) });
          cb({ data: () => ({ status: "shortlisted" }) });
        },
      });

      const result = await getProviderStats("uid-123");

      expect(result.listings).toBe(35);
      expect(result.applications).toBe(12);
      expect(result.accepted).toBe(1);
      expect(result.shortlisted).toBe(1);
    });
  });

  // ─── createOpportunity ──────────────────────────────────────────

  describe("createOpportunity", () => {
    it("writes a document and returns the new id", async () => {
      addDoc.mockResolvedValueOnce({ id: "new-opp-id" });

      const id = await createOpportunity({
        title:       "Software Internship",
        location:    "Cape Town",
        stipend:     "R3500/month",
        description: "Build cool stuff",
        providerUid: "uid-123",
        status:      "pending",
      });

      expect(id).toBe("new-opp-id");
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    it("includes serverTimestamp in the written document", async () => {
      addDoc.mockResolvedValueOnce({ id: "ts-test-id" });

      await createOpportunity({ title: "Test", providerUid: "uid-1", status: "pending" });

      const writtenData = addDoc.mock.calls[0][1];
      expect(writtenData.createdAt).toBe("SERVER_TIMESTAMP");
    });

    it("throws when Firestore write fails", async () => {
      addDoc.mockRejectedValueOnce(new Error("Firestore error"));

      await expect(
        createOpportunity({ title: "Bad", providerUid: "uid-1", status: "pending" })
      ).rejects.toThrow("Firestore error");
    });
  });

  // ─── updateApplicationStatus ────────────────────────────────────

  describe("updateApplicationStatus", () => {
    it("calls updateDoc with the correct status", async () => {
      updateDoc.mockResolvedValueOnce(undefined);
      doc.mockReturnValueOnce("doc-ref");

      await updateApplicationStatus("app-id-1", "accepted");

      expect(updateDoc).toHaveBeenCalledWith(
        "doc-ref",
        expect.objectContaining({ status: "accepted" })
      );
    });

    it("includes updatedAt serverTimestamp on update", async () => {
      updateDoc.mockResolvedValueOnce(undefined);
      doc.mockReturnValueOnce("doc-ref");

      await updateApplicationStatus("app-id-2", "shortlisted");

      const payload = updateDoc.mock.calls[0][1];
      expect(payload.updatedAt).toBe("SERVER_TIMESTAMP");
    });

    it("throws when Firestore update fails", async () => {
      updateDoc.mockRejectedValueOnce(new Error("Update failed"));
      doc.mockReturnValueOnce("doc-ref");

      await expect(
        updateApplicationStatus("app-id-3", "rejected")
      ).rejects.toThrow("Update failed");
    });
  });

  // ─── subscribeToProviderListings ────────────────────────────────

  describe("subscribeToProviderListings", () => {
    it("calls onSnapshot and returns an unsubscribe function", () => {
      const mockUnsubscribe = jest.fn();
      onSnapshot.mockReturnValueOnce(mockUnsubscribe);

      const { subscribeToProviderListings } = require("./providerService");
      const unsub = subscribeToProviderListings("uid-1", jest.fn(), jest.fn());

      expect(onSnapshot).toHaveBeenCalledTimes(1);
      expect(typeof unsub).toBe("function");
    });

    it("passes mapped documents to onData callback", () => {
      const onData = jest.fn();

      onSnapshot.mockImplementationOnce((q, successCb) => {
        successCb({
          docs: [
            { id: "l1", data: () => ({ title: "Internship", status: "approved" }) },
            { id: "l2", data: () => ({ title: "Learnership", status: "pending" }) },
          ],
        });
        return jest.fn();
      });

      const { subscribeToProviderListings } = require("./providerService");
      subscribeToProviderListings("uid-1", onData, jest.fn());

      expect(onData).toHaveBeenCalledWith([
        { id: "l1", title: "Internship",  status: "approved" },
        { id: "l2", title: "Learnership", status: "pending" },
      ]);
    });
  });

});
