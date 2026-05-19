import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ApplicationsPanel from "./ApplicationsPanel";

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock("./ApplicationsPanel.css", () => {}, { virtual: true });

jest.mock("../../../services/providerService", () => ({
  subscribeToProviderApplications: jest.fn(),
  updateApplicationStatus:         jest.fn(),
}));

jest.mock("../../../services/firebase", () => ({
  auth: { currentUser: { uid: "provider-uid" } },
}));

import {
  subscribeToProviderApplications,
  updateApplicationStatus,
} from "../../../services/providerService";

// ── Fixtures ───────────────────────────────────────────────────────────────

const APPS = [
  {
    id:               "app-1",
    applicantName:    "Alice Smith",
    applicantEmail:   "alice@example.com",
    applicantPhone:   "0821234567",
    opportunityTitle: "React Internship",
    status:           "submitted",
    cvUrl:            "https://example.com/cv1.pdf",
    education:        "BSc Computer Science",
    skills:           "React, Node.js",
    interests:        "Web development",
  },
  {
    id:               "app-2",
    applicantName:    "Bob Jones",
    applicantEmail:   "bob@example.com",
    opportunityTitle: "Java Learnership",
    status:           "shortlisted",
    cvUrl:            null,
  },
  {
    id:               "app-3",
    applicantName:    "Carol White",
    applicantEmail:   "carol@example.com",
    opportunityTitle: "React Internship",
    status:           "accepted",
  },
  {
    id:               "app-4",
    applicantName:    "Dave Brown",
    applicantEmail:   "dave@example.com",
    opportunityTitle: "QA Learnership",
    status:           "rejected",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function setupSubscription(apps = APPS) {
  subscribeToProviderApplications.mockImplementation((uid, onData, onError) => {
    onData(apps);
    return jest.fn(); // unsubscribe
  });
}

/**
 * Returns the <nav aria-label="Actions for {name}"> element inside an
 * expanded card, so action-button queries don't collide with filter buttons.
 */
function getActionsNav(applicantName) {
  return screen.getByRole("navigation", {
    name: new RegExp(`actions for ${applicantName}`, "i"),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("ApplicationsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateApplicationStatus.mockResolvedValue({});
  });

  // ── Loading & error states ─────────────────────────────────────────────────

  it("shows loading spinner before data arrives", () => {
    subscribeToProviderApplications.mockImplementation(() => jest.fn()); // never calls onData
    render(<ApplicationsPanel />);
    expect(screen.getByText(/loading applications/i)).toBeInTheDocument();
  });

  it("shows error message when subscription fires onError", () => {
    subscribeToProviderApplications.mockImplementation((uid, onData, onError) => {
      onError(new Error("fail"));
      return jest.fn();
    });
    render(<ApplicationsPanel />);
    expect(screen.getByRole("alert")).toHaveTextContent(/failed to load applications/i);
  });

  it("does not subscribe when there is no current user", () => {
    const firebase = require("../../../services/firebase");
    const orig = firebase.auth;
    firebase.auth = { currentUser: null };

    render(<ApplicationsPanel />);
    expect(subscribeToProviderApplications).not.toHaveBeenCalled();

    firebase.auth = orig;
  });

  // ── Rendering after data loads ─────────────────────────────────────────────

  it("renders the panel heading", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    expect(screen.getByText("Applications")).toBeInTheDocument();
  });

  it("shows the total application count chip", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    expect(screen.getByText(`${APPS.length} total`)).toBeInTheDocument();
  });

  it("renders a list item for each application", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getByText("Carol White")).toBeInTheDocument();
    expect(screen.getByText("Dave Brown")).toBeInTheDocument();
  });

  it("shows the opportunity title for each application", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    expect(screen.getAllByText("React Internship").length).toBeGreaterThanOrEqual(2);
  });

  // ── Filter buttons ─────────────────────────────────────────────────────────

  it("renders all filter buttons", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    ["All", "Pending Review", "Shortlisted", "Accepted", "Rejected"].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument()
    );
  });

  it("filter buttons show correct counts", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    // Each filter button has an <output> with the count
    // submitted = 1, shortlisted = 1, accepted = 1, rejected = 1, all = 4
    const allCountOutputs = screen
      .getAllByRole("status") // <output> elements
      .map((el) => el.textContent);
    expect(allCountOutputs).toContain("4"); // all
    expect(allCountOutputs).toContain("1"); // individual statuses
  });

  it("filters to only submitted applications", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    const filterNav = screen.getByRole("navigation", { name: /filter applications/i });
    fireEvent.click(within(filterNav).getByRole("button", { name: /pending review/i }));
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
  });

  it("filters to shortlisted applications", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    const filterNav = screen.getByRole("navigation", { name: /filter applications/i });
    fireEvent.click(within(filterNav).getByRole("button", { name: /shortlisted/i }));
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  it("filters to accepted applications", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    const filterNav = screen.getByRole("navigation", { name: /filter applications/i });
    fireEvent.click(within(filterNav).getByRole("button", { name: /accepted/i }));
    expect(screen.getByText("Carol White")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  it("filters to rejected applications", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    const filterNav = screen.getByRole("navigation", { name: /filter applications/i });
    fireEvent.click(within(filterNav).getByRole("button", { name: /rejected/i }));
    expect(screen.getByText("Dave Brown")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  it("responds to initialFilter prop", () => {
    setupSubscription();
    render(<ApplicationsPanel initialFilter="shortlisted" />);
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  it("updates filter when initialFilter prop changes", () => {
    setupSubscription();
    const { rerender } = render(<ApplicationsPanel initialFilter="all" />);
    rerender(<ApplicationsPanel initialFilter="accepted" />);
    expect(screen.getByText("Carol White")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  // ── Search ─────────────────────────────────────────────────────────────────

  it("renders the search input", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("filters by applicant name", async () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    await userEvent.type(screen.getByRole("searchbox"), "alice");
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
  });

  it("filters by email", async () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    await userEvent.type(screen.getByRole("searchbox"), "bob@example");
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  it("filters by opportunity title", async () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    await userEvent.type(screen.getByRole("searchbox"), "Java Learnership");
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.queryByText("Carol White")).not.toBeInTheDocument();
  });

  it("shows no-results message when search yields nothing", async () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    await userEvent.type(screen.getByRole("searchbox"), "zzznomatch");
    expect(screen.getByText(/no results for/i)).toBeInTheDocument();
  });

  it("renders a clear (×) button while search has text", async () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    await userEvent.type(screen.getByRole("searchbox"), "alice");
    expect(screen.getByRole("button", { name: /clear search/i })).toBeInTheDocument();
  });

  it("clears search when the × button is clicked", async () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    await userEvent.type(screen.getByRole("searchbox"), "alice");
    fireEvent.click(screen.getByRole("button", { name: /clear search/i }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  // ── Expand / collapse ──────────────────────────────────────────────────────

  it("application details are hidden by default", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    expect(screen.queryByText("alice@example.com")).not.toBeInTheDocument();
  });

  it("expands an application card when its summary button is clicked", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /alice smith/i }));
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("collapses an expanded card when clicked again", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    const btn = screen.getByRole("button", { name: /alice smith/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.queryByText("alice@example.com")).not.toBeInTheDocument();
  });

  it("only one card can be expanded at a time", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /alice smith/i }));
    fireEvent.click(screen.getByRole("button", { name: /bob jones/i }));
    expect(screen.queryByText("alice@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  // ── Card details ───────────────────────────────────────────────────────────

  it("shows education, skills and interests when expanded", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /alice smith/i }));
    expect(screen.getByText("BSc Computer Science")).toBeInTheDocument();
    expect(screen.getByText("React, Node.js")).toBeInTheDocument();
    expect(screen.getByText("Web development")).toBeInTheDocument();
  });

  it("shows a download CV link when cvUrl is present", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /alice smith/i }));
    expect(screen.getByRole("link", { name: /download cv/i })).toHaveAttribute(
      "href",
      "https://example.com/cv1.pdf"
    );
  });

  it("shows 'No CV uploaded.' when cvUrl is null", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /bob jones/i }));
    expect(screen.getByText(/no cv uploaded/i)).toBeInTheDocument();
  });

  it("shows phone link when applicantPhone is present", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /alice smith/i }));
    expect(screen.getByRole("link", { name: "0821234567" })).toHaveAttribute(
      "href",
      "tel:0821234567"
    );
  });

  // ── Status actions ─────────────────────────────────────────────────────────

  // Helper: get the actions nav scoped to a specific applicant's expanded card
  function getActionsNav(applicantName) {
    return screen.getByRole("navigation", {
      name: new RegExp(`actions for ${applicantName}`, "i"),
    });
  }

  it("renders Accept, Shortlist and Reject buttons when expanded", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /alice smith/i }));
    const nav = getActionsNav("Alice Smith");
    expect(within(nav).getByRole("button", { name: /accept/i })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: /shortlist/i })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: /reject/i })).toBeInTheDocument();
  });

  it("the current status button is disabled", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /bob jones/i })); // shortlisted
    const nav = getActionsNav("Bob Jones");
    expect(within(nav).getByRole("button", { name: /shortlist/i })).toBeDisabled();
  });

  it("calls updateApplicationStatus with correct args when Accept is clicked", async () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /alice smith/i }));
    const nav = getActionsNav("Alice Smith");
    fireEvent.click(within(nav).getByRole("button", { name: /accept/i }));
    await waitFor(() =>
      expect(updateApplicationStatus).toHaveBeenCalledWith("app-1", "accepted")
    );
  });

  it("shows 'Updating…' text while the status is being updated", async () => {
    updateApplicationStatus.mockReturnValue(new Promise(() => {}));
    setupSubscription();
    render(<ApplicationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /alice smith/i }));
    const nav = getActionsNav("Alice Smith");
    fireEvent.click(within(nav).getByRole("button", { name: /accept/i }));
    await waitFor(() => expect(screen.getByText("Updating…")).toBeInTheDocument());
  });

  it("shows error alert when updateApplicationStatus rejects", async () => {
    updateApplicationStatus.mockRejectedValue(new Error("network"));
    setupSubscription();
    render(<ApplicationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /alice smith/i }));
    const nav = getActionsNav("Alice Smith");
    fireEvent.click(within(nav).getByRole("button", { name: /reject/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to update status/i)
    );
  });

  it("does not show current-status paragraph for submitted applications", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /alice smith/i }));
    // submitted → the current status note should not appear
    expect(screen.queryByText(/current:/i)).not.toBeInTheDocument();
  });

  it("shows current-status paragraph for non-submitted applications", () => {
    setupSubscription();
    render(<ApplicationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /bob jones/i })); // shortlisted
    expect(screen.getByText(/current:/i)).toBeInTheDocument();
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  it("shows 'No applications yet' when the list is empty", () => {
    setupSubscription([]);
    render(<ApplicationsPanel />);
    expect(screen.getByText(/no.*applications yet/i)).toBeInTheDocument();
  });

  it("shows empty state message for a specific filter with no matches", () => {
    setupSubscription([]);
    render(<ApplicationsPanel initialFilter="accepted" />);
    expect(screen.getByText(/no accepted applications yet/i)).toBeInTheDocument();
  });

  // ── Cleanup ────────────────────────────────────────────────────────────────

  it("calls the unsubscribe function on unmount", () => {
    const unsubscribe = jest.fn();
    subscribeToProviderApplications.mockReturnValue(unsubscribe);
    // Trigger onData immediately too so loading stops
    subscribeToProviderApplications.mockImplementation((uid, onData) => {
      onData([]);
      return unsubscribe;
    });
    const { unmount } = render(<ApplicationsPanel />);
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});