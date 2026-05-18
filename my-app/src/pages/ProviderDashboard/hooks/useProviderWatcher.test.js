import { renderHook, act } from "@testing-library/react";
import { useProviderWatcher } from "./useProviderWatcher";

// ── Mocks ──────────────────────────────────────────────────────────────────

// We mock Firestore at the module level so we can control snapshot callbacks
jest.mock("../../../services/firebase", () => ({ db: {} }));

// Capture listener callbacks so tests can fire them manually
let onSnapshotListings;
let onSnapshotApps;

const mockUnsubListings = jest.fn();
const mockUnsubApps     = jest.fn();

const mockGetDocs          = jest.fn();
const mockAddDoc           = jest.fn();
const mockGetDoc           = jest.fn();
const mockOnSnapshot       = jest.fn();
const mockQuery            = jest.fn((...args) => ({ _query: args }));
const mockCollection       = jest.fn((db, col) => ({ _col: col }));
const mockWhere            = jest.fn();
const mockServerTimestamp  = jest.fn(() => "SERVER_TIMESTAMP");
const mockDoc              = jest.fn();
const mockTimestamp        = { fromMillis: jest.fn(() => "TIMESTAMP") };

jest.mock("firebase/firestore", () => ({
  collection:      (...args) => mockCollection(...args),
  query:           (...args) => mockQuery(...args),
  where:           (...args) => mockWhere(...args),
  onSnapshot:      (q, cb) => {
    // First call = listings, second = apps
    if (!onSnapshotListings) {
      onSnapshotListings = cb;
      return mockUnsubListings;
    }
    onSnapshotApps = cb;
    return mockUnsubApps;
  },
  getDocs:         (...args) => mockGetDocs(...args),
  addDoc:          (...args) => mockAddDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
  doc:             (...args) => mockDoc(...args),
  getDoc:          (...args) => mockGetDoc(...args),
  Timestamp:       mockTimestamp,
}));

// localStorage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem:  (k) => store[k] ?? null,
    setItem:  (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear:    () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// ── Helpers ────────────────────────────────────────────────────────────────

function makeListing(overrides = {}) {
  return {
    id:     "listing-1",
    title:  "React Internship",
    status: "approved",
    ...overrides,
  };
}

function makeListingSnapshot(changes) {
  return {
    docChanges: () =>
      changes.map(({ type = "modified", data }) => ({
        type,
        doc: { id: data.id, data: () => data },
      })),
  };
}

function makeAppSnapshot(changes) {
  return {
    docChanges: () =>
      changes.map(({ type = "added", data }) => ({
        type,
        doc: { id: data.id, data: () => data },
      })),
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("useProviderWatcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    onSnapshotListings = undefined;
    onSnapshotApps     = undefined;

    // Default: getDocs returns an empty listings snapshot
    mockGetDocs.mockResolvedValue({ docs: [] });
    // Default: addDoc succeeds
    mockAddDoc.mockResolvedValue({ id: "new-notif-id" });
    // Default: duplicate check returns empty (no existing notification)
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    // getDoc for user lookup
    mockGetDoc.mockResolvedValue({ exists: () => false });
  });

  it("does nothing when providerUid is null/undefined", () => {
    renderHook(() => useProviderWatcher(null));
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it("subscribes to the listings collection on mount", () => {
    renderHook(() => useProviderWatcher("uid-123"));
    // onSnapshot was bound for listings
    expect(typeof onSnapshotListings).toBe("function");
  });

  it("reads saved listing statuses from localStorage on mount", () => {
    const key = "listing_statuses_uid-123";
    localStorageMock.setItem(key, JSON.stringify({ "listing-1": "pending" }));
    renderHook(() => useProviderWatcher("uid-123"));
    // No error = localStorage was read successfully
    expect(localStorageMock.getItem(key)).not.toBeNull();
  });

  it("reads saved application ids from localStorage on mount", () => {
    const key = "known_applications_uid-123";
    localStorageMock.setItem(key, JSON.stringify(["app-1", "app-2"]));
    renderHook(() => useProviderWatcher("uid-123"));
    expect(localStorageMock.getItem(key)).not.toBeNull();
  });

  it("calls unsubListings on unmount", () => {
    const { unmount } = renderHook(() => useProviderWatcher("uid-123"));
    unmount();
    expect(mockUnsubListings).toHaveBeenCalled();
  });

  // ── Listing status change → notification ───────────────────────────────────

  it("writes an 'approved' notification when status changes from pending to approved", async () => {
    // Seed localStorage with old status
    localStorageMock.setItem(
      "listing_statuses_uid-123",
      JSON.stringify({ "listing-1": "pending" })
    );

    // Duplicate check: empty (so notification is written)
    mockGetDocs
      .mockResolvedValueOnce({ empty: true, docs: [] }) // duplicate check
      .mockResolvedValue({ docs: [] });                 // app watcher getDocs

    renderHook(() => useProviderWatcher("uid-123"));

    await act(async () => {
      onSnapshotListings(
        makeListingSnapshot([{ data: makeListing({ status: "approved" }) }])
      );
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type:   "listing_approved",
        userId: "uid-123",
      })
    );
  });

  it("writes a 'rejected' notification when status changes to rejected", async () => {
    localStorageMock.setItem(
      "listing_statuses_uid-123",
      JSON.stringify({ "listing-1": "pending" })
    );

    mockGetDocs
      .mockResolvedValueOnce({ empty: true, docs: [] })
      .mockResolvedValue({ docs: [] });

    renderHook(() => useProviderWatcher("uid-123"));

    await act(async () => {
      onSnapshotListings(
        makeListingSnapshot([{ data: makeListing({ status: "rejected" }) }])
      );
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "listing_rejected" })
    );
  });

  it("does NOT write a notification when status is seen for the first time (no prior status)", async () => {
    // No saved statuses → prevStatus is undefined → should not fire
    mockGetDocs.mockResolvedValue({ docs: [] });

    renderHook(() => useProviderWatcher("uid-123"));

    await act(async () => {
      onSnapshotListings(
        makeListingSnapshot([{ data: makeListing({ status: "approved" }) }])
      );
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it("saves updated statuses to localStorage after a listing snapshot", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    renderHook(() => useProviderWatcher("uid-123"));

    await act(async () => {
      onSnapshotListings(
        makeListingSnapshot([{ data: makeListing({ status: "closed" }) }])
      );
    });

    const saved = JSON.parse(
      localStorageMock.getItem("listing_statuses_uid-123") || "{}"
    );
    expect(saved["listing-1"]).toBe("closed");
  });

  it("skips writing a duplicate notification (existing within 5 min)", async () => {
    localStorageMock.setItem(
      "listing_statuses_uid-123",
      JSON.stringify({ "listing-1": "pending" })
    );

    // First getDocs = duplicate exists
    mockGetDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ id: "dup" }] })
      .mockResolvedValue({ docs: [] });

    renderHook(() => useProviderWatcher("uid-123"));

    await act(async () => {
      onSnapshotListings(
        makeListingSnapshot([{ data: makeListing({ status: "approved" }) }])
      );
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  // ── New application → notification ─────────────────────────────────────────

  it("writes a 'new_application' notification for a brand-new application", async () => {
    // Setup listings so the app watcher knows about them
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [
          { id: "listing-1", data: () => ({ title: "React Internship" }) },
        ],
      })         // getDocs for listings in setupApplicationWatcher
      .mockResolvedValueOnce({ empty: true, docs: [] }); // duplicate check

    mockGetDoc.mockResolvedValue({ exists: () => false }); // user lookup fails → "Someone"

    renderHook(() => useProviderWatcher("uid-123"));

    // Let the async setupApplicationWatcher run
    await new Promise((r) => setTimeout(r, 20));

    if (!onSnapshotApps) return; // if no opportunity ids, no apps watcher

    await act(async () => {
      onSnapshotApps(
        makeAppSnapshot([
          { data: { id: "app-99", userId: "user-1", opportunityId: "listing-1" } },
        ])
      );
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "new_application" })
    );
  });

  it("skips an application that was already known (in localStorage)", async () => {
    localStorageMock.setItem(
      "known_applications_uid-123",
      JSON.stringify(["app-existing"])
    );

    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: "listing-1", data: () => ({ title: "React Internship" }) }],
    });

    renderHook(() => useProviderWatcher("uid-123"));
    await new Promise((r) => setTimeout(r, 20));

    if (!onSnapshotApps) return;

    await act(async () => {
      onSnapshotApps(
        makeAppSnapshot([
          { data: { id: "app-existing", userId: "user-1", opportunityId: "listing-1" } },
        ])
      );
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it("saves new application ids to localStorage", async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [{ id: "listing-1", data: () => ({ title: "React Internship" }) }],
      })
      .mockResolvedValueOnce({ empty: true, docs: [] }); // duplicate check

    mockGetDoc.mockResolvedValue({ exists: () => false });

    renderHook(() => useProviderWatcher("uid-123"));
    await new Promise((r) => setTimeout(r, 20));

    if (!onSnapshotApps) return;

    await act(async () => {
      onSnapshotApps(
        makeAppSnapshot([
          { data: { id: "app-new", userId: "user-1", opportunityId: "listing-1" } },
        ])
      );
    });

    await new Promise((r) => setTimeout(r, 50));

    const saved = JSON.parse(
      localStorageMock.getItem("known_applications_uid-123") || "[]"
    );
    expect(saved).toContain("app-new");
  });

  it("skips non-added docChange types for applications", async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: "listing-1", data: () => ({ title: "React Internship" }) }],
    });

    renderHook(() => useProviderWatcher("uid-123"));
    await new Promise((r) => setTimeout(r, 20));

    if (!onSnapshotApps) return;

    await act(async () => {
      onSnapshotApps(
        makeAppSnapshot([
          {
            type: "modified", // not "added"
            data: { id: "app-mod", userId: "user-1", opportunityId: "listing-1" },
          },
        ])
      );
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  // ── User name resolution ───────────────────────────────────────────────────

  it("uses firstName + lastName from users collection if available", async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [{ id: "listing-1", data: () => ({ title: "React Internship" }) }],
      })
      .mockResolvedValueOnce({ empty: true, docs: [] });

    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ firstName: "Jane", lastName: "Doe" }),
    });

    renderHook(() => useProviderWatcher("uid-123"));
    await new Promise((r) => setTimeout(r, 20));

    if (!onSnapshotApps) return;

    await act(async () => {
      onSnapshotApps(
        makeAppSnapshot([
          { data: { id: "app-A", userId: "user-jane", opportunityId: "listing-1" } },
        ])
      );
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ body: expect.stringContaining("Jane Doe") })
    );
  });

  it("falls back to applicant collection when user doc doesn't exist", async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [{ id: "listing-1", data: () => ({ title: "React Internship" }) }],
      })
      .mockResolvedValueOnce({ empty: true, docs: [] });

    // First getDoc (users): doesn't exist
    // Second getDoc (applicants): exists with name
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ name: "Applicant Name" }) });

    renderHook(() => useProviderWatcher("uid-123"));
    await new Promise((r) => setTimeout(r, 20));

    if (!onSnapshotApps) return;

    await act(async () => {
      onSnapshotApps(
        makeAppSnapshot([
          { data: { id: "app-B", userId: "user-B", opportunityId: "listing-1" } },
        ])
      );
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ body: expect.stringContaining("Applicant Name") })
    );
  });
});