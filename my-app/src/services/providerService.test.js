jest.mock("firebase/firestore", () => ({
  collection:      jest.fn((_, name) => ({ name })),
  query:           jest.fn((...args) => args),
  where:           jest.fn((...args) => args),
  onSnapshot:      jest.fn((...args) => args),
  addDoc:          jest.fn(),
  updateDoc:       jest.fn(),
  deleteDoc:       jest.fn(),
  getDoc:          jest.fn(),
  getDocs:         jest.fn(),
  serverTimestamp: jest.fn(() => "SERVER_TS"),
  Timestamp:       { fromMillis: (ms) => ({ toMillis: () => ms }) },
  doc:             jest.fn((_db, col, id) => ({ path: `${col}/${id}` })),
}));

jest.mock("./firebase", () => ({
  db:   {},
  auth: {
    currentUser: {
      uid:         "provider-uid-123",
      email:       "provider@test.com",
      displayName: "Test Provider",
    },
  },
}));

jest.mock("@emailjs/browser", () => ({
  default: { send: jest.fn().mockResolvedValue({}) },
}));

import {
  writeNotification,
  markNotificationRead,
  getApplicationCountsForListings,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  autoCloseExpiredListings,
  updateApplicationStatus,
  getProviderStats,
  notifyProviderPostStatus,
  notifyProviderApproval,
  notifyProviderNewApplication,
} from "./providerService";

const firestoreMock       = jest.requireMock("firebase/firestore");
const mockAddDoc          = firestoreMock.addDoc;
const mockUpdateDoc       = firestoreMock.updateDoc;
const mockDeleteDoc       = firestoreMock.deleteDoc;
const mockGetDoc          = firestoreMock.getDoc;
const mockGetDocs         = firestoreMock.getDocs;
const mockServerTimestamp = firestoreMock.serverTimestamp;


// ── Helpers ───────────────────────────────────────────────────────────────────

const makeSnap = (docs) => ({
  docs: docs.map((d) => ({ id: d.id, data: () => d, exists: () => true })),
  size: docs.length,
  forEach: (fn) => docs.forEach((d) => fn({ id: d.id, data: () => d })),
});

const makeDocSnap = (data, exists = true) => ({
  exists: () => exists,
  data:   () => data,
  id:     data?.id ?? "doc-id",
});

beforeEach(() => {
  jest.clearAllMocks();
  mockServerTimestamp.mockReturnValue("SERVER_TS");
  firestoreMock.serverTimestamp.mockReturnValue("SERVER_TS");  // ← add this
  mockAddDoc.mockResolvedValue({ id: "new-doc-id" });
  mockUpdateDoc.mockResolvedValue(undefined);
  mockDeleteDoc.mockResolvedValue(undefined);
});

// ── writeNotification ─────────────────────────────────────────────────────────

describe("writeNotification", () => {
  it("writes a notification document to Firestore", async () => {
    await writeNotification({ userId: "u1", type: "listing_approved", title: "Approved", body: "Your listing was approved." });
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.userId).toBe("u1");
    expect(payload.type).toBe("listing_approved");
    expect(payload.read).toBe(false);
    expect(payload.createdAt).toBe("SERVER_TS");
  });

  it("includes applicationId when provided", async () => {
    await writeNotification({ userId: "u1", type: "new_application", title: "New", body: "Body", applicationId: "app-123" });
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.applicationId).toBe("app-123");
  });

  it("omits applicationId when not provided", async () => {
    await writeNotification({ userId: "u1", type: "listing_approved", title: "T", body: "B" });
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.applicationId).toBeUndefined();
  });

  it("does not throw when Firestore fails", async () => {
    mockAddDoc.mockRejectedValueOnce(new Error("Firestore error"));
    await expect(
      writeNotification({ userId: "u1", type: "t", title: "T", body: "B" })
    ).resolves.not.toThrow();
  });
});

// ── markNotificationRead ──────────────────────────────────────────────────────

describe("markNotificationRead", () => {
  it("calls updateDoc with read: true", async () => {
    await markNotificationRead("notif-123");
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const payload = mockUpdateDoc.mock.calls[0][1];
    expect(payload.read).toBe(true);
  });

  it("does not throw when Firestore fails", async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error("fail"));
    await expect(markNotificationRead("notif-123")).resolves.not.toThrow();
  });
});

// ── getApplicationCountsForListings ──────────────────────────────────────────

describe("getApplicationCountsForListings", () => {
  it("returns empty object for empty input", async () => {
    const result = await getApplicationCountsForListings([]);
    expect(result).toEqual({});
  });

  it("returns zero counts when no applications exist", async () => {
    mockGetDocs.mockResolvedValueOnce(makeSnap([]));
    const result = await getApplicationCountsForListings(["opp-1", "opp-2"]);
    expect(result).toEqual({ "opp-1": 0, "opp-2": 0 });
  });

  it("correctly counts applications per listing", async () => {
    mockGetDocs.mockResolvedValueOnce(
      makeSnap([
        { id: "a1", opportunityId: "opp-1" },
        { id: "a2", opportunityId: "opp-1" },
        { id: "a3", opportunityId: "opp-2" },
      ])
    );
    const result = await getApplicationCountsForListings(["opp-1", "opp-2"]);
    expect(result["opp-1"]).toBe(2);
    expect(result["opp-2"]).toBe(1);
  });

  it("handles null input gracefully", async () => {
    const result = await getApplicationCountsForListings(null);
    expect(result).toEqual({});
  });
});

// ── createOpportunity ─────────────────────────────────────────────────────────

describe("createOpportunity", () => {
  it("adds document with correct provider fields", async () => {
    mockAddDoc.mockResolvedValueOnce({ id: "opp-new" });
    const id = await createOpportunity({ title: "Dev Learnership", location: "JHB" });
    expect(id).toBe("opp-new");
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.title).toBe("Dev Learnership");
    expect(payload.providerUid).toBe("provider-uid-123");
    expect(payload.status).toBe("pending");
    expect(payload.createdAt).toBe("SERVER_TS");
  });
});

// ── updateOpportunity ─────────────────────────────────────────────────────────

describe("updateOpportunity", () => {
  it("calls updateDoc with the provided data plus updatedAt", async () => {
    await updateOpportunity("opp-123", { title: "Updated Title" });
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const payload = mockUpdateDoc.mock.calls[0][1];
    expect(payload.title).toBe("Updated Title");
    expect(payload.updatedAt).toBe("SERVER_TS");
  });
});

// ── deleteOpportunity ─────────────────────────────────────────────────────────

describe("deleteOpportunity", () => {
  it("calls deleteDoc with the correct document reference", async () => {
    await deleteOpportunity("opp-to-delete");
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });
});

// ── autoCloseExpiredListings ──────────────────────────────────────────────────

describe("autoCloseExpiredListings", () => {
  it("closes listings whose closing date has passed", async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    mockGetDocs.mockResolvedValueOnce(
      makeSnap([
        { id: "opp-expired", providerUid: "p1", status: "approved", closingDate: yesterday },
      ])
    );
    await autoCloseExpiredListings("p1");
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const payload = mockUpdateDoc.mock.calls[0][1];
    expect(payload.status).toBe("closed");
  });

  it("does not close listings whose closing date is in the future", async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    mockGetDocs.mockResolvedValueOnce(
      makeSnap([
        { id: "opp-valid", providerUid: "p1", status: "approved", closingDate: tomorrow },
      ])
    );
    await autoCloseExpiredListings("p1");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("ignores listings with no closing date", async () => {
    mockGetDocs.mockResolvedValueOnce(
      makeSnap([{ id: "opp-no-date", providerUid: "p1", status: "approved" }])
    );
    await autoCloseExpiredListings("p1");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

// ── getProviderStats ──────────────────────────────────────────────────────────

describe("getProviderStats", () => {
  it("returns zeroes when provider has no listings", async () => {
    mockGetDocs.mockResolvedValueOnce(makeSnap([]));
    const stats = await getProviderStats("p1");
    expect(stats.listings).toBe(0);
    expect(stats.approved).toBe(0);
    expect(stats.applications).toBe(0);
  });

  it("counts listings and applications correctly", async () => {
    mockGetDocs
      .mockResolvedValueOnce(makeSnap([
        { id: "o1", status: "approved" },
        { id: "o2", status: "pending" },
      ]))
      .mockResolvedValueOnce(makeSnap([
        { id: "a1", opportunityId: "o1", status: "accepted" },
        { id: "a2", opportunityId: "o1", status: "shortlisted" },
        { id: "a3", opportunityId: "o2", status: "submitted" },
      ]));

    const stats = await getProviderStats("p1");
    expect(stats.listings).toBe(2);
    expect(stats.approved).toBe(1);
    expect(stats.pending).toBe(1);
    expect(stats.applications).toBe(3);
    expect(stats.accepted).toBe(1);
    expect(stats.shortlisted).toBe(1);
  });
});

// ── updateApplicationStatus ───────────────────────────────────────────────────

describe("updateApplicationStatus", () => {
  it("updates the application document status", async () => {
    mockGetDoc
      .mockResolvedValueOnce(makeDocSnap({ userId: "u1", opportunityId: "o1", title: "Dev Role" }))
      .mockResolvedValueOnce(makeDocSnap({ email: "applicant@test.com", firstName: "Tumi", lastName: "Ndaba" }))
      .mockResolvedValueOnce(makeDocSnap({ title: "Dev Learnership" }));

    await updateApplicationStatus("app-1", "accepted");
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const payload = mockUpdateDoc.mock.calls[0][1];
    expect(payload.status).toBe("accepted");
  });

  it("does nothing if application does not exist", async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false, data: () => null });
    await updateApplicationStatus("missing-app", "accepted");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

// ── notifyProviderPostStatus ──────────────────────────────────────────────────

describe("notifyProviderPostStatus", () => {
  it("writes an approved notification", async () => {
    await notifyProviderPostStatus({
      providerUid: "p1", providerEmail: "p@test.com",
      providerName: "Provider", opportunityTitle: "Dev Role", approved: true,
    });
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.type).toBe("listing_approved");
    expect(payload.userId).toBe("p1");
  });

  it("writes a removed notification when not approved", async () => {
    await notifyProviderPostStatus({
      providerUid: "p1", providerEmail: "p@test.com",
      providerName: "Provider", opportunityTitle: "Dev Role", approved: false,
    });
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.type).toBe("listing_rejected");
  });
});

// ── notifyProviderApproval ────────────────────────────────────────────────────

describe("notifyProviderApproval", () => {
  it("writes an account_approved notification", async () => {
    await notifyProviderApproval({
      providerUid: "p1", providerEmail: "p@test.com", providerName: "P", approved: true,
    });
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.type).toBe("account_approved");
  });

  it("writes an account_rejected notification", async () => {
    await notifyProviderApproval({
      providerUid: "p1", providerEmail: "p@test.com", providerName: "P", approved: false,
    });
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.type).toBe("account_rejected");
  });
});

// ── notifyProviderNewApplication ──────────────────────────────────────────────

describe("notifyProviderNewApplication", () => {
  it("writes a new_application notification", async () => {
    await notifyProviderNewApplication({
      providerUid: "p1", applicantName: "Tumi Ndaba",
      opportunityTitle: "Dev Role", applicationId: "app-1",
    });
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.type).toBe("new_application");
    expect(payload.body).toContain("Tumi Ndaba");
    expect(payload.body).toContain("Dev Role");
    expect(payload.applicationId).toBe("app-1");
  });
});

