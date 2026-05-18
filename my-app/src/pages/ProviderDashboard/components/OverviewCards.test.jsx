import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import OverviewCards from "./OverviewCards";

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock("./OverviewCards.css", () => {}, { virtual: true });

jest.mock("../../../services/providerService", () => ({
  getProviderStats: jest.fn(),
}));

jest.mock("../../../services/firebase", () => ({
  auth: { currentUser: { uid: "test-uid-123" } },
}));

import { getProviderStats } from "../../../services/providerService";

const MOCK_STATS = {
  listings:     10,
  approved:      6,
  pending:       2,
  applications: 30,
  shortlisted:   8,
  accepted:      4,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function renderCards(overrides = {}) {
  const props = {
    setTab:               jest.fn(),
    setListingFilter:     jest.fn(),
    setApplicationFilter: jest.fn(),
    ...overrides,
  };
  return { ...render(<OverviewCards {...props} />), ...props };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("OverviewCards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getProviderStats.mockResolvedValue(MOCK_STATS);
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it("shows skeleton cards while loading", () => {
    getProviderStats.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = renderCards();
    expect(container.querySelectorAll(".overview-card--skeleton")).toHaveLength(6);
  });

  it("renders an accessible loading region during fetch", () => {
    getProviderStats.mockReturnValue(new Promise(() => {}));
    renderCards();
    expect(screen.getByLabelText(/loading overview statistics/i)).toBeInTheDocument();
  });

  // ── Error state ────────────────────────────────────────────────────────────

  it("shows error message when getProviderStats rejects", async () => {
    getProviderStats.mockRejectedValue(new Error("network error"));
    renderCards();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to load stats/i);
    });
  });

  // ── Successful render ──────────────────────────────────────────────────────

  it("renders the Overview heading after loading", async () => {
    renderCards();
    await waitFor(() => expect(screen.getByText("Overview")).toBeInTheDocument());
  });

  it("renders the subtitle 'Your dashboard at a glance'", async () => {
    renderCards();
    await waitFor(() =>
      expect(screen.getByText(/Your dashboard at a glance/i)).toBeInTheDocument()
    );
  });

  it("renders all 6 stat cards", async () => {
    const { container } = renderCards();
    await waitFor(() => {
      expect(container.querySelectorAll(".overview-card--clickable")).toHaveLength(6);
    });
  });

  it("displays the correct value for each stat", async () => {
    renderCards();
    await waitFor(() => {
      expect(screen.getByLabelText(/Total Listings: 10/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Live Listings: 6/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Pending Approval: 2/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Total Applications: 30/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Shortlisted: 8/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Accepted: 4/i)).toBeInTheDocument();
    });
  });

  it("displays 0 for any missing stat key", async () => {
    getProviderStats.mockResolvedValue({});
    renderCards();
    await waitFor(() => {
      expect(screen.getByLabelText(/Total Listings: 0/i)).toBeInTheDocument();
    });
  });

  // ── Application rate ───────────────────────────────────────────────────────

  it("calculates and displays the average applications per listing", async () => {
    renderCards(); // 30 / 10 = 3.0
    await waitFor(() => expect(screen.getByText("3.0")).toBeInTheDocument());
  });

  it("shows '0.0' application rate when listings is 0", async () => {
    getProviderStats.mockResolvedValue({ ...MOCK_STATS, listings: 0 });
    renderCards();
    await waitFor(() => expect(screen.getByText("0.0")).toBeInTheDocument());
  });

  // ── Card click – listings ──────────────────────────────────────────────────

  it("clicking 'Total Listings' calls setTab('listings') and setListingFilter('all')", async () => {
    const { setTab, setListingFilter } = renderCards();
    await waitFor(() => screen.getByLabelText(/Total Listings: 10/i));
    await userEvent.click(screen.getByLabelText(/Total Listings: 10/i));
    expect(setListingFilter).toHaveBeenCalledWith("all");
    expect(setTab).toHaveBeenCalledWith("listings");
  });

  it("clicking 'Live Listings' calls setListingFilter('approved')", async () => {
    const { setListingFilter } = renderCards();
    await waitFor(() => screen.getByLabelText(/Live Listings: 6/i));
    await userEvent.click(screen.getByLabelText(/Live Listings: 6/i));
    expect(setListingFilter).toHaveBeenCalledWith("approved");
  });

  it("clicking 'Pending Approval' calls setListingFilter('pending')", async () => {
    const { setListingFilter } = renderCards();
    await waitFor(() => screen.getByLabelText(/Pending Approval: 2/i));
    await userEvent.click(screen.getByLabelText(/Pending Approval: 2/i));
    expect(setListingFilter).toHaveBeenCalledWith("pending");
  });

  // ── Card click – applications ──────────────────────────────────────────────

  it("clicking 'Total Applications' calls setTab('applications') and setApplicationFilter('all')", async () => {
    const { setTab, setApplicationFilter } = renderCards();
    await waitFor(() => screen.getByLabelText(/Total Applications: 30/i));
    await userEvent.click(screen.getByLabelText(/Total Applications: 30/i));
    expect(setApplicationFilter).toHaveBeenCalledWith("all");
    expect(setTab).toHaveBeenCalledWith("applications");
  });

  it("clicking 'Shortlisted' calls setApplicationFilter('shortlisted')", async () => {
    const { setApplicationFilter } = renderCards();
    await waitFor(() => screen.getByLabelText(/Shortlisted: 8/i));
    await userEvent.click(screen.getByLabelText(/Shortlisted: 8/i));
    expect(setApplicationFilter).toHaveBeenCalledWith("shortlisted");
  });

  it("clicking 'Accepted' calls setApplicationFilter('accepted')", async () => {
    const { setApplicationFilter } = renderCards();
    await waitFor(() => screen.getByLabelText(/Accepted: 4/i));
    await userEvent.click(screen.getByLabelText(/Accepted: 4/i));
    expect(setApplicationFilter).toHaveBeenCalledWith("accepted");
  });

  // ── No uid edge case ───────────────────────────────────────────────────────

  it("does not call getProviderStats when there is no current user", async () => {
    const firebase = require("../../../services/firebase");
    const origAuth = firebase.auth;
    firebase.auth = { currentUser: null };

    renderCards();
    await act(async () => {});
    expect(getProviderStats).not.toHaveBeenCalled();

    firebase.auth = origAuth;
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it("renders the application summary chip with an aria-label", async () => {
    renderCards();
    await waitFor(() =>
      expect(screen.getByLabelText(/Application summary/i)).toBeInTheDocument()
    );
  });

  it("stat cards are rendered as <button> elements", async () => {
    renderCards();
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(6);
    });
  });
});