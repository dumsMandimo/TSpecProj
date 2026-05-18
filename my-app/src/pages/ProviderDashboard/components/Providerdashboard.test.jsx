import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProviderDashboard from "./ProviderDashboard";

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock("./ProviderDashboard.css", () => {}, { virtual: true });

// Child panels – keep them thin so we isolate the dashboard logic
jest.mock("./components/Sidebar",               () => ({ setTab, activeTab, unreadCount }) => (
  <nav data-testid="sidebar">
    <button onClick={() => setTab("overview")}      data-active={activeTab === "overview"}>Overview</button>
    <button onClick={() => setTab("listings")}      data-active={activeTab === "listings"}>My Listings</button>
    <button onClick={() => setTab("applications")}  data-active={activeTab === "applications"}>Applications</button>
    <button onClick={() => setTab("notifications")} data-active={activeTab === "notifications"}>Notifications</button>
    <button onClick={() => setTab("create")}        data-active={activeTab === "create"}>Post Opportunity</button>
    <span data-testid="unread-count">{unreadCount}</span>
  </nav>
));

jest.mock("./components/Navbar", () => ({ providerName, onLogout }) => (
  <header data-testid="navbar">
    <span>{providerName}</span>
    <button onClick={onLogout}>Sign out</button>
  </header>
));

jest.mock("./components/OverviewCards", () => ({ setTab, setListingFilter, setApplicationFilter }) => (
  <section data-testid="overview-cards">
    <button onClick={() => { setListingFilter("approved"); setTab("listings"); }}>Go to approved listings</button>
    <button onClick={() => { setApplicationFilter("shortlisted"); setTab("applications"); }}>Go to shortlisted</button>
  </section>
));

jest.mock("./components/ListingsPanel",       () => ({ initialFilter }) => (
  <section data-testid="listings-panel" data-filter={initialFilter} />
));
jest.mock("./components/ApplicationsPanel",   () => ({ initialFilter }) => (
  <section data-testid="applications-panel" data-filter={initialFilter} />
));
jest.mock("./components/NotificationsPanel",  () => () => <section data-testid="notifications-panel" />);
jest.mock("./components/CreateOpportunityForm", () => () => <section data-testid="create-form" />);

jest.mock("../../services/providerService", () => ({
  subscribeToProviderNotifications: jest.fn(),
}));

jest.mock("../../services/firebase", () => ({
  auth: {
    currentUser: {
      uid:         "uid-abc",
      displayName: "Test Provider",
      email:       "test@example.com",
    },
  },
}));

jest.mock("firebase/auth", () => ({
  signOut: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("./hooks/useProviderWatcher", () => ({
  useProviderWatcher: jest.fn(),
}));

import { subscribeToProviderNotifications } from "../../services/providerService";
import { signOut } from "firebase/auth";

// ── Helper ─────────────────────────────────────────────────────────────────

function setupNotifications(notifications = []) {
  subscribeToProviderNotifications.mockImplementation((uid, onData) => {
    onData(notifications);
    return jest.fn();
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("ProviderDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupNotifications();
  });

  // ── Initial render ─────────────────────────────────────────────────────────

  it("renders the Sidebar", () => {
    render(<ProviderDashboard />);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("renders the Navbar", () => {
    render(<ProviderDashboard />);
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
  });

  it("shows the provider display name in the Navbar", () => {
    render(<ProviderDashboard />);
    expect(screen.getByText("Test Provider")).toBeInTheDocument();
  });

  it("defaults to the overview tab on mount", () => {
    render(<ProviderDashboard />);
    expect(screen.getByTestId("overview-cards")).toBeInTheDocument();
  });

  it("does not render other panels on initial load", () => {
    render(<ProviderDashboard />);
    expect(screen.queryByTestId("listings-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("applications-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("notifications-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("create-form")).not.toBeInTheDocument();
  });

  // ── Tab navigation ─────────────────────────────────────────────────────────

  it("switches to listings panel when 'My Listings' is clicked", () => {
    render(<ProviderDashboard />);
    fireEvent.click(screen.getByRole("button", { name: /my listings/i }));
    expect(screen.getByTestId("listings-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("overview-cards")).not.toBeInTheDocument();
  });

  it("switches to applications panel", () => {
    render(<ProviderDashboard />);
    fireEvent.click(screen.getByRole("button", { name: /applications/i }));
    expect(screen.getByTestId("applications-panel")).toBeInTheDocument();
  });

  it("switches to notifications panel", () => {
    render(<ProviderDashboard />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByTestId("notifications-panel")).toBeInTheDocument();
  });

  it("switches to create form", () => {
    render(<ProviderDashboard />);
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));
    expect(screen.getByTestId("create-form")).toBeInTheDocument();
  });

  it("navigates back to overview", () => {
    render(<ProviderDashboard />);
    fireEvent.click(screen.getByRole("button", { name: /my listings/i }));
    fireEvent.click(screen.getByRole("button", { name: /overview/i }));
    expect(screen.getByTestId("overview-cards")).toBeInTheDocument();
  });

  // ── Filter propagation from OverviewCards ──────────────────────────────────

  it("passes 'approved' listingFilter to ListingsPanel when drilled from OverviewCards", () => {
    render(<ProviderDashboard />);
    fireEvent.click(screen.getByRole("button", { name: /go to approved listings/i }));
    const panel = screen.getByTestId("listings-panel");
    expect(panel).toHaveAttribute("data-filter", "approved");
  });

  it("passes 'shortlisted' applicationFilter to ApplicationsPanel when drilled from OverviewCards", () => {
    render(<ProviderDashboard />);
    fireEvent.click(screen.getByRole("button", { name: /go to shortlisted/i }));
    const panel = screen.getByTestId("applications-panel");
    expect(panel).toHaveAttribute("data-filter", "shortlisted");
  });

  // ── Unread count ───────────────────────────────────────────────────────────

  it("passes unreadCount=0 to Sidebar when there are no unread notifications", () => {
    setupNotifications([{ id: "n-1", read: true }]);
    render(<ProviderDashboard />);
    expect(screen.getByTestId("unread-count")).toHaveTextContent("0");
  });

  it("passes the correct unread count to Sidebar", () => {
    setupNotifications([
      { id: "n-1", read: false },
      { id: "n-2", read: false },
      { id: "n-3", read: true },
    ]);
    render(<ProviderDashboard />);
    expect(screen.getByTestId("unread-count")).toHaveTextContent("2");
  });

  // ── Authentication guards ──────────────────────────────────────────────────

  it("redirects to /login when there is no current user", async () => {
    const firebase = require("../../services/firebase");
    const orig = firebase.auth;
    firebase.auth = { currentUser: null };

    render(<ProviderDashboard />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));

    firebase.auth = orig;
  });

  // ── Logout ─────────────────────────────────────────────────────────────────

  it("calls signOut and navigates to /login on logout", async () => {
    signOut.mockResolvedValue();
    render(<ProviderDashboard />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  // ── Provider name fallbacks ────────────────────────────────────────────────

  it("uses email as provider name when displayName is absent", () => {
    const firebase = require("../../services/firebase");
    const orig = firebase.auth.currentUser;
    firebase.auth.currentUser = { uid: "uid-abc", displayName: null, email: "no-name@example.com" };

    render(<ProviderDashboard />);
    expect(screen.getByText("no-name@example.com")).toBeInTheDocument();

    firebase.auth.currentUser = orig;
  });

  it("uses 'Provider' as fallback when both displayName and email are absent", () => {
    const firebase = require("../../services/firebase");
    const orig = firebase.auth.currentUser;
    firebase.auth.currentUser = { uid: "uid-abc", displayName: null, email: null };

    render(<ProviderDashboard />);
    expect(screen.getByText("Provider")).toBeInTheDocument();

    firebase.auth.currentUser = orig;
  });

  // ── Cleanup ────────────────────────────────────────────────────────────────

  it("unsubscribes from notifications on unmount", () => {
    const unsubscribe = jest.fn();
    subscribeToProviderNotifications.mockImplementation((uid, onData) => {
      onData([]);
      return unsubscribe;
    });
    const { unmount } = render(<ProviderDashboard />);
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});