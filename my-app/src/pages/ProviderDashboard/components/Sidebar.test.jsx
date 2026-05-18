import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Sidebar from "./Sidebar";

jest.mock("./Sidebar.css", () => {}, { virtual: true });

const NAV_ITEMS = [
  { key: "overview",      label: "Overview" },
  { key: "listings",      label: "My Listings" },
  { key: "applications",  label: "Applications" },
  { key: "notifications", label: "Notifications" },
  { key: "create",        label: "Post Opportunity" },
];

describe("Sidebar", () => {
  const setTab = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it("renders all 5 navigation items", () => {
    render(<Sidebar setTab={setTab} activeTab="overview" />);
    NAV_ITEMS.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("renders the brand name 'UbuntuCareers'", () => {
    render(<Sidebar setTab={setTab} activeTab="overview" />);
    expect(screen.getByText("UbuntuCareers")).toBeInTheDocument();
  });

  it("renders the 'Provider Portal' subtitle", () => {
    render(<Sidebar setTab={setTab} activeTab="overview" />);
    expect(screen.getByText("Provider Portal")).toBeInTheDocument();
  });

  it("renders the logo mark 'UC'", () => {
    render(<Sidebar setTab={setTab} activeTab="overview" />);
    expect(screen.getByText("UC")).toBeInTheDocument();
  });

  it("renders the footer tagline", () => {
    render(<Sidebar setTab={setTab} activeTab="overview" />);
    expect(screen.getByText(/Ubuntu · Community · Growth/i)).toBeInTheDocument();
  });

  // ── Active state ───────────────────────────────────────────────────────────

  it.each(NAV_ITEMS)("marks $key nav button as active when activeTab=$key", ({ key }) => {
    render(<Sidebar setTab={setTab} activeTab={key} />);
    const btn = screen.getByRole("button", { name: new RegExp(NAV_ITEMS.find(n => n.key === key).label, "i") });
    expect(btn).toHaveAttribute("aria-current", "page");
  });

  it("does not mark a button as active when it is not the active tab", () => {
    render(<Sidebar setTab={setTab} activeTab="overview" />);
    const listingsBtn = screen.getByRole("button", { name: /my listings/i });
    expect(listingsBtn).not.toHaveAttribute("aria-current", "page");
  });

  it("applies active CSS class only to the active tab button", () => {
    const { container } = render(<Sidebar setTab={setTab} activeTab="listings" />);
    const activeButtons = container.querySelectorAll(".sidebar__nav-btn--active");
    expect(activeButtons).toHaveLength(1);
  });

  // ── Tab change callbacks ───────────────────────────────────────────────────

  it.each(NAV_ITEMS)("calls setTab with '$key' when $label is clicked", ({ key, label }) => {
    render(<Sidebar setTab={setTab} activeTab="overview" />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(label, "i") }));
    expect(setTab).toHaveBeenCalledWith(key);
  });

  it("calls setTab exactly once per click", () => {
    render(<Sidebar setTab={setTab} activeTab="overview" />);
    fireEvent.click(screen.getByRole("button", { name: /my listings/i }));
    expect(setTab).toHaveBeenCalledTimes(1);
  });

  // ── Notification badge ─────────────────────────────────────────────────────

  it("does not render a badge when unreadCount is 0", () => {
    render(<Sidebar setTab={setTab} activeTab="overview" unreadCount={0} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not render a badge when unreadCount is not provided", () => {
    render(<Sidebar setTab={setTab} activeTab="overview" />);
    // No badge output element
    const badge = document.querySelector(".sidebar__badge");
    expect(badge).toBeNull();
  });

  it("renders the unread badge with the correct count", () => {
    render(<Sidebar setTab={setTab} activeTab="overview" unreadCount={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("badge has the correct aria-label", () => {
    render(<Sidebar setTab={setTab} activeTab="overview" unreadCount={3} />);
    expect(screen.getByLabelText(/3 unread notifications/i)).toBeInTheDocument();
  });

  it("only shows badge on the notifications button", () => {
    const { container } = render(<Sidebar setTab={setTab} activeTab="overview" unreadCount={7} />);
    const badges = container.querySelectorAll(".sidebar__badge");
    expect(badges).toHaveLength(1);
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it("renders an <aside> element", () => {
    const { container } = render(<Sidebar setTab={setTab} activeTab="overview" />);
    expect(container.querySelector("aside")).toBeInTheDocument();
  });

  it("renders a <nav> with aria-label 'Provider navigation'", () => {
    render(<Sidebar setTab={setTab} activeTab="overview" />);
    expect(screen.getByRole("navigation", { name: /provider navigation/i })).toBeInTheDocument();
  });

  it("nav icon spans have aria-hidden='true'", () => {
    const { container } = render(<Sidebar setTab={setTab} activeTab="overview" />);
    const icons = container.querySelectorAll(".sidebar__nav-icon");
    icons.forEach((icon) => expect(icon).toHaveAttribute("aria-hidden", "true"));
  });

  it("applies the CTA class to the 'create' button", () => {
    const { container } = render(<Sidebar setTab={setTab} activeTab="overview" />);
    const ctaButtons = container.querySelectorAll(".sidebar__nav-btn--cta");
    expect(ctaButtons).toHaveLength(1);
    expect(ctaButtons[0]).toHaveTextContent("Post Opportunity");
  });
});