import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import NotificationsPanel from "./NotificationsPanel";

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock("./NotificationsPanel.css", () => {}, { virtual: true });

jest.mock("../../../services/providerService", () => ({
  subscribeToProviderNotifications: jest.fn(),
  markNotificationRead:             jest.fn(),
}));

jest.mock("../../../services/firebase", () => ({
  auth: { currentUser: { uid: "provider-uid" } },
}));

import {
  subscribeToProviderNotifications,
  markNotificationRead,
} from "../../../services/providerService";

// ── Fixtures ───────────────────────────────────────────────────────────────

const makeTimestamp = (minutesAgo) => ({
  toDate: () => new Date(Date.now() - minutesAgo * 60000),
});

const NOTIFICATIONS = [
  {
    id:        "n-1",
    type:      "new_application",
    title:     "New Application Received",
    body:      "Alice applied for React Internship.",
    read:      false,
    createdAt: makeTimestamp(5),
  },
  {
    id:        "n-2",
    type:      "listing_approved",
    title:     "Listing approved: React Internship",
    body:      "Your listing has been approved.",
    read:      false,
    createdAt: makeTimestamp(60),
  },
  {
    id:        "n-3",
    type:      "listing_rejected",
    title:     "Listing rejected: Java Learnership",
    body:      "Your listing was not approved.",
    read:      true,
    createdAt: makeTimestamp(1440), // 1 day ago
  },
  {
    id:        "n-4",
    type:      "account_approved",
    title:     "Account Approved",
    body:      "Your provider account has been approved.",
    read:      true,
    createdAt: makeTimestamp(10080), // 7 days ago
  },
];

// ── Helper ─────────────────────────────────────────────────────────────────

function setupSubscription(notifications = NOTIFICATIONS) {
  subscribeToProviderNotifications.mockImplementation((uid, onData, onError) => {
    onData(notifications);
    return jest.fn();
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("NotificationsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    markNotificationRead.mockResolvedValue({});
  });

  // ── Loading & error ────────────────────────────────────────────────────────

  it("shows loading message before data arrives", () => {
    subscribeToProviderNotifications.mockReturnValue(jest.fn());
    render(<NotificationsPanel />);
    expect(screen.getByText(/loading notifications/i)).toBeInTheDocument();
  });

  it("shows error message when subscription fires onError", () => {
    subscribeToProviderNotifications.mockImplementation((uid, onData, onError) => {
      onError(new Error("fail"));
      return jest.fn();
    });
    render(<NotificationsPanel />);
    expect(screen.getByRole("alert")).toHaveTextContent(/failed to load notifications/i);
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it("renders the Notifications heading", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("renders a notification item for each notification", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    expect(screen.getByText("New Application Received")).toBeInTheDocument();
    expect(screen.getByText("Listing approved: React Internship")).toBeInTheDocument();
    expect(screen.getByText("Listing rejected: Java Learnership")).toBeInTheDocument();
    expect(screen.getByText("Account Approved")).toBeInTheDocument();
  });

  it("renders notification body text", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    expect(screen.getByText("Alice applied for React Internship.")).toBeInTheDocument();
  });

  // ── Unread badge ───────────────────────────────────────────────────────────

  it("shows the unread count badge in the heading when there are unread notifications", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    // 2 unread (n-1 and n-2)
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("does not show the heading badge when all notifications are read", () => {
    setupSubscription(NOTIFICATIONS.map((n) => ({ ...n, read: true })));
    render(<NotificationsPanel />);
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });

  // ── Mark as read ───────────────────────────────────────────────────────────

  it("renders a mark-as-read button for each unread notification", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    const readBtns = screen.getAllByRole("button", { name: /mark as read/i });
    expect(readBtns).toHaveLength(2); // n-1 and n-2
  });

  it("does not render mark-as-read button for already read notifications", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    // We expect exactly 2 (the unread ones)
    expect(screen.getAllByRole("button", { name: /mark as read/i })).toHaveLength(2);
  });

  it("calls markNotificationRead with the correct id when clicked", async () => {
    setupSubscription();
    render(<NotificationsPanel />);
    const [firstReadBtn] = screen.getAllByRole("button", { name: /mark as read/i });
    fireEvent.click(firstReadBtn);
    await waitFor(() =>
      expect(markNotificationRead).toHaveBeenCalledWith("n-1")
    );
  });

  // ── Mark all as read ───────────────────────────────────────────────────────

  it("shows 'Mark all as read' button when there are unread notifications", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    expect(screen.getByRole("button", { name: /mark all as read/i })).toBeInTheDocument();
  });

  it("hides 'Mark all as read' button when all are read", () => {
    setupSubscription(NOTIFICATIONS.map((n) => ({ ...n, read: true })));
    render(<NotificationsPanel />);
    expect(screen.queryByRole("button", { name: /mark all as read/i })).not.toBeInTheDocument();
  });

  it("calls markNotificationRead for every unread notification when 'Mark all as read' is clicked", async () => {
    setupSubscription();
    render(<NotificationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /mark all as read/i }));
    await waitFor(() => {
      expect(markNotificationRead).toHaveBeenCalledWith("n-1");
      expect(markNotificationRead).toHaveBeenCalledWith("n-2");
      expect(markNotificationRead).toHaveBeenCalledTimes(2);
    });
  });

  // ── Filter buttons ─────────────────────────────────────────────────────────

  it("renders filter buttons: All, Unread, Applications, Approved, Rejected, Account", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    ["All", "Unread", "Applications", "Approved", "Rejected", "Account"].forEach((label) =>
      expect(screen.getByRole("button", { name: new RegExp(label, "i") })).toBeInTheDocument()
    );
  });

  it("shows only unread notifications when Unread filter is active", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /^unread/i }));
    expect(screen.getByText("New Application Received")).toBeInTheDocument();
    expect(screen.getByText("Listing approved: React Internship")).toBeInTheDocument();
    expect(screen.queryByText("Listing rejected: Java Learnership")).not.toBeInTheDocument();
  });

  it("filters to new_application type", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /^applications/i }));
    expect(screen.getByText("New Application Received")).toBeInTheDocument();
    expect(screen.queryByText("Listing approved: React Internship")).not.toBeInTheDocument();
  });

  it("filters to listing_approved type", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /^approved/i }));
    expect(screen.getByText("Listing approved: React Internship")).toBeInTheDocument();
    expect(screen.queryByText("New Application Received")).not.toBeInTheDocument();
  });

  it("filters to listing_rejected type", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /^rejected/i }));
    expect(screen.getByText("Listing rejected: Java Learnership")).toBeInTheDocument();
    expect(screen.queryByText("New Application Received")).not.toBeInTheDocument();
  });

  it("filters to account_approved type", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /^account/i }));
    expect(screen.getByText("Account Approved")).toBeInTheDocument();
    expect(screen.queryByText("New Application Received")).not.toBeInTheDocument();
  });

  it("shows all notifications when All filter is reselected", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /^unread/i }));
    fireEvent.click(screen.getByRole("button", { name: /^all/i }));
    expect(screen.getAllByText(/received|approved|rejected|account/i).length).toBeGreaterThanOrEqual(4);
  });

  // ── Unread count badge on filter button ────────────────────────────────────

  it("shows unread count on the Unread filter button", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    const unreadBtn = screen.getByRole("button", { name: /^unread/i });
    expect(unreadBtn).toHaveTextContent("2");
  });

  // ── Time labels ────────────────────────────────────────────────────────────

  it("shows time-ago label for a recent notification", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    expect(screen.getByText("5m ago")).toBeInTheDocument();
  });

  it("shows hours-ago label", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    expect(screen.getByText("1h ago")).toBeInTheDocument();
  });

  it("shows days-ago label", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    expect(screen.getByText("1d ago")).toBeInTheDocument();
  });

  it("shows formatted date for timestamps older than 7 days", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    // n-4 is 7 days old; should show a date string (not Xd ago)
    const times = screen.getAllByRole("time");
    // at least one time element should have a formatted date
    const textContents = times.map((t) => t.textContent);
    expect(textContents.some((t) => /\d{4}|\d{1,2}\//.test(t))).toBe(true);
  });

  // ── Type labels / icons ────────────────────────────────────────────────────

  it("shows 'New Application' type label", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    expect(screen.getByText("New Application")).toBeInTheDocument();
  });

  it("shows 'Listing Approved' type label", () => {
    setupSubscription();
    render(<NotificationsPanel />);
    expect(screen.getByText("Listing Approved")).toBeInTheDocument();
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  it("shows empty state message when there are no notifications", () => {
    setupSubscription([]);
    render(<NotificationsPanel />);
    expect(screen.getByText(/no notifications here yet/i)).toBeInTheDocument();
  });

  it("shows empty state when Unread filter has no unread notifications", () => {
    setupSubscription(NOTIFICATIONS.map((n) => ({ ...n, read: true })));
    render(<NotificationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /^unread/i }));
    expect(screen.getByText(/no notifications here yet/i)).toBeInTheDocument();
  });

  // ── Cleanup ────────────────────────────────────────────────────────────────

  it("calls the unsubscribe function on unmount", () => {
    const unsubscribe = jest.fn();
    subscribeToProviderNotifications.mockImplementation((uid, onData) => {
      onData([]);
      return unsubscribe;
    });
    const { unmount } = render(<NotificationsPanel />);
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});