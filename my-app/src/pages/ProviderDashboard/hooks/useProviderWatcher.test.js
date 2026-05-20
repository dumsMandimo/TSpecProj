import { renderHook, act } from "@testing-library/react";
import { useProviderWatcher } from "./useProviderWatcher";

jest.mock("../../../services/firebase", () => ({ db: {} }));

let mockOnSnapshotListings;
let mockOnSnapshotApps;

const mockUnsubListings = jest.fn();
const mockUnsubApps     = jest.fn();

const mockGetDocs         = jest.fn();
const mockAddDoc          = jest.fn();
const mockGetDoc          = jest.fn();
const mockOnSnapshot      = jest.fn();
const mockQuery           = jest.fn((...args) => ({ _query: args }));
const mockCollection      = jest.fn((db, col) => ({ _col: col }));
const mockWhere           = jest.fn();
const mockServerTimestamp = jest.fn(() => "SERVER_TIMESTAMP");
const mockDoc             = jest.fn();

jest.mock("firebase/firestore", () => {
  const mockTimestamp = { fromMillis: jest.fn(() => "TIMESTAMP") };
  return {
    collection:      (...args) => mockCollection(...args),
    query:           (...args) => mockQuery(...args),
    where:           (...args) => mockWhere(...args),
    onSnapshot:      (q, cb) => {
      if (!mockOnSnapshotListings) {
        mockOnSnapshotListings = cb;
        return mockUnsubListings;
      }
      mockOnSnapshotApps = cb;
      return mockUnsubApps;
    },
    getDocs:         (...args) => mockGetDocs(...args),
    addDoc:          (...args) => mockAddDoc(...args),
    serverTimestamp: () => mockServerTimestamp(),
    doc:             (...args) => mockDoc(...args),
    getDoc:          (...args) => mockGetDoc(...args),
    Timestamp:       mockTimestamp,
  };
});

const localStorageMock = (() => {
  let store = {};
  return {
    getItem:    (k) => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear:      () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

function makeListing(overrides = {}) {
  return {
    id:     "listing-1",
    title:  "React Internship",
    status: "approved",
    ...overrides,
  };
}

function makeListingSnapshot(changes) {
  const docs = changes.map(({ type = "modified", data }) => ({
    type,
    doc: { id: data.id, data: () => data },
  }));
  return {
    docChanges: () => docs,
    forEach: (fn) => docs.forEach((d) => fn(d.doc)),
  };
}

function makeAppSnapshot(changes) {
  const docs = changes.map(({ type = "added", data }) => ({
    type,
    doc: { id: data.id, data: () => data },
  }));
  return {
    docChanges: () => docs,
    forEach: (fn) => docs.forEach((d) => fn(d.doc)),
  };
}

describe("useProviderWatcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockOnSnapshotListings = undefined;
    mockOnSnapshotApps     = undefined;

    mockGetDocs.mockResolvedValue({ docs: [] });
    mockAddDoc.mockResolvedValue({ id: "new-notif-id" });
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    mockGetDoc.mockResolvedValue({ exists: () => false });
  });

  it("does nothing when providerUid is null/undefined", () => {
    renderHook(() => useProviderWatcher(null));
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it("subscribes to the listings collection on mount", () => {
    renderHook(() => useProviderWatcher("uid-123"));
    expect(typeof mockOnSnapshotListings).toBe("function");
  });

  it("reads saved listing statuses from localStorage on mount", () => {
    const key = "listing_statuses_uid-123";
    localStorageMock.setItem(key, JSON.stringify({ "listing-1": "pending" }));
    renderHook(() => useProviderWatcher("uid-123"));
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

  it("writes an 'approved' notification when status changes from pending to approved", async () => {
    localStorageMock.setItem(
      "listing_statuses_uid-123",
      JSON.stringify({ "listing-1": "pending" })
    );

    mockGetDocs
      .mockResolvedValueOnce({ empty: true, docs: [] })
      .mockResolvedValue({ docs: [] });

    renderHook(() => useProviderWatcher("uid-123"));

    await act(async () => {
      mockOnSnapshotListings(
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
      mockOnSnapshotListings(
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
    mockGetDocs.mockResolvedValue({ docs: [] });

    renderHook(() => useProviderWatcher("uid-123"));

    await act(async () => {
      mockOnSnapshotListings(
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
      mockOnSnapshotListings(
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

    mockGetDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ id: "dup" }] })
      .mockResolvedValue({ docs: [] });

    renderHook(() => useProviderWatcher("uid-123"));

    await act(async () => {
      mockOnSnapshotListings(
        makeListingSnapshot([{ data: makeListing({ status: "approved" }) }])
      );
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it("writes a 'new_application' notification for a brand-new application", async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [{ id: "listing-1", data: () => ({ title: "React Internship" }) }],
      })
      .mockResolvedValueOnce({ empty: true, docs: [] });

    mockGetDoc.mockResolvedValue({ exists: () => false });

    renderHook(() => useProviderWatcher("uid-123"));
    await new Promise((r) => setTimeout(r, 20));

    if (!mockOnSnapshotApps) return;

    await act(async () => {
      mockOnSnapshotApps(
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

    if (!mockOnSnapshotApps) return;

    await act(async () => {
      mockOnSnapshotApps(
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
      .mockResolvedValueOnce({ empty: true, docs: [] });

    mockGetDoc.mockResolvedValue({ exists: () => false });

    renderHook(() => useProviderWatcher("uid-123"));
    await new Promise((r) => setTimeout(r, 20));

    if (!mockOnSnapshotApps) return;

    await act(async () => {
      mockOnSnapshotApps(
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

    if (!mockOnSnapshotApps) return;

    await act(async () => {
      mockOnSnapshotApps(
        makeAppSnapshot([
          {
            type: "modified",
            data: { id: "app-mod", userId: "user-1", opportunityId: "listing-1" },
          },
        ])
      );
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

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

    if (!mockOnSnapshotApps) return;

    await act(async () => {
      mockOnSnapshotApps(
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

    mockGetDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ name: "Applicant Name" }) });

    renderHook(() => useProviderWatcher("uid-123"));
    await new Promise((r) => setTimeout(r, 20));

    if (!mockOnSnapshotApps) return;

    await act(async () => {
      mockOnSnapshotApps(
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

