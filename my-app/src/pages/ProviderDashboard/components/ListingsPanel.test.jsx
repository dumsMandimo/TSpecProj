import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ListingsPanel from "./ListingsPanel";

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock("./ListingsPanel.css", () => {}, { virtual: true });

jest.mock("../../../services/providerService", () => ({
  subscribeToProviderListings:        jest.fn(),
  updateOpportunity:                  jest.fn(),
  deleteOpportunity:                  jest.fn(),
  getApplicationCountsForListings:    jest.fn(),
  autoCloseExpiredListings:           jest.fn(),
}));

jest.mock("../../../services/firebase", () => ({
  auth: { currentUser: { uid: "provider-uid" } },
}));

import {
  subscribeToProviderListings,
  updateOpportunity,
  deleteOpportunity,
  getApplicationCountsForListings,
  autoCloseExpiredListings,
} from "../../../services/providerService";

// ── Fixtures ───────────────────────────────────────────────────────────────

const FUTURE_DATE = "2099-12-31";
const PAST_DATE   = "2000-01-01";

const LISTINGS = [
  {
    id:          "list-1",
    title:       "React Internship",
    location:    "Cape Town",
    type:        "internship",
    status:      "approved",
    stipend:     "R4 000/month",
    closingDate: FUTURE_DATE,
    description: "Build cool React apps.",
  },
  {
    id:          "list-2",
    title:       "Java Learnership",
    location:    "Johannesburg",
    type:        "learnership",
    status:      "pending",
    closingDate: FUTURE_DATE,
    description: "Learn Java enterprise.",
  },
  {
    id:          "list-3",
    title:       "QA Apprenticeship",
    location:    "Durban",
    type:        "apprenticeship",
    status:      "closed",
    closingDate: PAST_DATE,
    description: "Quality assurance.",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function setupSubscription(listings = LISTINGS) {
  autoCloseExpiredListings.mockResolvedValue();
  getApplicationCountsForListings.mockResolvedValue({ "list-1": 5, "list-2": 2, "list-3": 0 });

  subscribeToProviderListings.mockImplementation((uid, onData) => {
    onData(listings);
    return jest.fn();
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("ListingsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateOpportunity.mockResolvedValue({});
    deleteOpportunity.mockResolvedValue({});
  });

  // ── Loading & error ────────────────────────────────────────────────────────

  it("shows loading spinner before data arrives", () => {
    autoCloseExpiredListings.mockResolvedValue();
    subscribeToProviderListings.mockReturnValue(jest.fn()); // never calls onData
    render(<ListingsPanel />);
    expect(screen.getByText(/loading your listings/i)).toBeInTheDocument();
  });

  it("shows error when subscription fires onError", () => {
    autoCloseExpiredListings.mockResolvedValue();
    subscribeToProviderListings.mockImplementation((uid, onData, onError) => {
      onError(new Error("fail"));
      return jest.fn();
    });
    render(<ListingsPanel />);
    expect(screen.getByRole("alert")).toHaveTextContent(/failed to load listings/i);
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it("renders the 'My Listings' heading", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => expect(screen.getByText("My Listings")).toBeInTheDocument());
  });

  it("shows total listings count", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => expect(screen.getByText(`${LISTINGS.length} total`)).toBeInTheDocument());
  });

  it("renders a summary button for each listing", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => {
      expect(screen.getByText("React Internship")).toBeInTheDocument();
      expect(screen.getByText("Java Learnership")).toBeInTheDocument();
      expect(screen.getByText("QA Apprenticeship")).toBeInTheDocument();
    });
  });

  it("shows application counts fetched from the service", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => expect(screen.getByTitle(/applications received/i)).toBeInTheDocument());
  });

  it("shows expired tag for an approved listing whose closing date is past", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() =>
      expect(screen.queryByText("Expired")).not.toBeInTheDocument()
    );
    // Only list-3 (closed) has a past date; list-1 is approved + future date so no expired tag
  });

  // ── Filter buttons ─────────────────────────────────────────────────────────

  it("renders all filter buttons", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => {
      ["All", "Approved", "Pending", "Closed"].forEach((label) =>
        expect(screen.getByText(label)).toBeInTheDocument()
      );
    });
  });

  it("filters to approved listings only", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /^approved/i }));
    expect(screen.getByText("React Internship")).toBeInTheDocument();
    expect(screen.queryByText("Java Learnership")).not.toBeInTheDocument();
  });

  it("filters to pending listings", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("Java Learnership"));
    fireEvent.click(screen.getByRole("button", { name: /^pending/i }));
    expect(screen.getByText("Java Learnership")).toBeInTheDocument();
    expect(screen.queryByText("React Internship")).not.toBeInTheDocument();
  });

  it("respects initialFilter prop", async () => {
    setupSubscription();
    render(<ListingsPanel initialFilter="closed" />);
    await waitFor(() => {
      expect(screen.getByText("QA Apprenticeship")).toBeInTheDocument();
      expect(screen.queryByText("React Internship")).not.toBeInTheDocument();
    });
  });

  it("updates filter when initialFilter prop changes", async () => {
    setupSubscription();
    const { rerender } = render(<ListingsPanel initialFilter="all" />);
    await waitFor(() => screen.getByText("React Internship"));
    rerender(<ListingsPanel initialFilter="pending" />);
    expect(screen.getByText("Java Learnership")).toBeInTheDocument();
    expect(screen.queryByText("React Internship")).not.toBeInTheDocument();
  });

  // ── Expand / collapse ──────────────────────────────────────────────────────

  it("listing details are hidden by default", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    expect(screen.queryByText("Build cool React apps.")).not.toBeInTheDocument();
  });

  it("expands a listing when its summary is clicked", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /react internship/i }));
    expect(screen.getByText("Build cool React apps.")).toBeInTheDocument();
  });

  it("collapses an expanded listing on second click", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    const btn = screen.getByRole("button", { name: /react internship/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.queryByText("Build cool React apps.")).not.toBeInTheDocument();
  });

  it("shows stipend in expanded view", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /react internship/i }));
    expect(screen.getByText("R4 000/month")).toBeInTheDocument();
  });

  it("shows closing date in expanded view", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /react internship/i }));
    // date is formatted; check label exists
    expect(screen.getByText(/closing date/i)).toBeInTheDocument();
  });

  // ── Edit flow ──────────────────────────────────────────────────────────────

  it("shows edit form when Edit button is clicked", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /react internship/i }));
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("pre-populates the edit form with the listing's current values", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /react internship/i }));
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(screen.getByDisplayValue("React Internship")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Cape Town")).toBeInTheDocument();
  });

  it("calls updateOpportunity with updated values on save", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /react internship/i }));
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    const titleInput = screen.getByDisplayValue("React Internship");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Vue Internship");

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() =>
      expect(updateOpportunity).toHaveBeenCalledWith(
        "list-1",
        expect.objectContaining({ title: "Vue Internship" })
      )
    );
  });

  it("shows 'Saving…' while saving", async () => {
    updateOpportunity.mockReturnValue(new Promise(() => {}));
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /react internship/i }));
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(screen.getByText("Saving…")).toBeInTheDocument());
  });

  it("hides the edit form and returns to detail view after cancel", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /react internship/i }));
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument();
  });

  it("shows an error if updateOpportunity rejects", async () => {
    updateOpportunity.mockRejectedValue(new Error("fail"));
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /react internship/i }));
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to save changes/i)
    );
  });

  // ── Delete flow ────────────────────────────────────────────────────────────

  it("shows delete confirmation dialog when Delete is clicked", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /react internship/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    expect(screen.getByText(/yes, delete/i)).toBeInTheDocument();
  });

  it("calls deleteOpportunity when 'Yes, Delete' is confirmed", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /react internship/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));
    await waitFor(() => expect(deleteOpportunity).toHaveBeenCalledWith("list-1"));
  });

  it("dismisses the confirm dialog on Cancel", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /react internship/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.queryByText(/yes, delete/i)).not.toBeInTheDocument();
  });

  it("shows 'Deleting…' while the delete call is in flight", async () => {
    deleteOpportunity.mockReturnValue(new Promise(() => {}));
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /react internship/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));
    await waitFor(() => expect(screen.getByText("Deleting…")).toBeInTheDocument());
  });

  it("shows an error if deleteOpportunity rejects", async () => {
    deleteOpportunity.mockRejectedValue(new Error("fail"));
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /react internship/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to delete listing/i)
    );
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  it("shows empty state message when no listings exist", async () => {
    setupSubscription([]);
    render(<ListingsPanel />);
    await waitFor(() => expect(screen.getByText(/no.*listings yet/i)).toBeInTheDocument());
  });

  // ── autoCloseExpiredListings ───────────────────────────────────────────────

  it("calls autoCloseExpiredListings on mount", async () => {
    setupSubscription();
    render(<ListingsPanel />);
    await waitFor(() => expect(autoCloseExpiredListings).toHaveBeenCalledWith("provider-uid"));
  });

  // ── Unsubscribe ────────────────────────────────────────────────────────────

  it("calls unsubscribe on unmount", async () => {
    const unsubscribe = jest.fn();
    autoCloseExpiredListings.mockResolvedValue();
    getApplicationCountsForListings.mockResolvedValue({});
    subscribeToProviderListings.mockImplementation((uid, onData) => {
      onData([]);
      return unsubscribe;
    });
    const { unmount } = render(<ListingsPanel />);
    await waitFor(() => screen.getByText(/no.*listings yet/i));
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});