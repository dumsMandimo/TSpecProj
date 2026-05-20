import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "./Navbar";

// Mock the CSS import
jest.mock("./Navbar.css", () => {}, { virtual: true });

describe("Navbar", () => {
  const defaultProps = {
    providerName: "Jane Doe",
    onLogout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it("renders the welcome greeting with the provider name", () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText(/Welcome back,/i)).toBeInTheDocument();
    expect(screen.getAllByText("Jane Doe")[0]).toBeInTheDocument();
  });

  it("renders the Sign out button", () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("renders the user chip with the provider name", () => {
    render(<Navbar {...defaultProps} />);
    // Name appears both in greeting and in the chip
    const names = screen.getAllByText("Jane Doe");
    expect(names.length).toBeGreaterThanOrEqual(1);
  });

  // ── Initials / Avatar ──────────────────────────────────────────────────────

  it("displays correct two-letter initials for a full name", () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("displays only the first initial for a single-word name", () => {
    render(<Navbar providerName="Alice" onLogout={jest.fn()} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("slices initials to a max of 2 characters", () => {
    render(<Navbar providerName="Anne Betty Carol" onLogout={jest.fn()} />);
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("displays uppercase initials", () => {
    render(<Navbar providerName="john doe" onLogout={jest.fn()} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  // ── Fallback when providerName is empty / undefined ────────────────────────

  it('falls back to "P" avatar when providerName is an empty string', () => {
    render(<Navbar providerName="" onLogout={jest.fn()} />);
    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it('falls back to "P" avatar when providerName is undefined', () => {
    render(<Navbar providerName={undefined} onLogout={jest.fn()} />);
    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it('shows "Provider" in greeting when providerName is falsy', () => {
    render(<Navbar providerName="" onLogout={jest.fn()} />);
    expect(screen.getByText("Provider")).toBeInTheDocument();
  });

  // ── Logout interaction ─────────────────────────────────────────────────────

  it("calls onLogout when Sign out button is clicked", () => {
    const onLogout = jest.fn();
    render(<Navbar providerName="Jane Doe" onLogout={onLogout} />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("does not call onLogout on render", () => {
    const onLogout = jest.fn();
    render(<Navbar providerName="Jane Doe" onLogout={onLogout} />);
    expect(onLogout).not.toHaveBeenCalled();
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it("renders a <header> element", () => {
    const { container } = render(<Navbar {...defaultProps} />);
    expect(container.querySelector("header")).toBeInTheDocument();
  });

  it("renders a <nav> with aria-label 'User actions'", () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByRole("navigation", { name: /user actions/i })).toBeInTheDocument();
  });

  it("the user chip has an aria-label describing the logged-in user", () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByLabelText(/logged in as jane doe/i)).toBeInTheDocument();
  });

  it("avatar span has aria-hidden='true'", () => {
    const { container } = render(<Navbar {...defaultProps} />);
    const avatar = container.querySelector(".navbar__avatar");
    expect(avatar).toHaveAttribute("aria-hidden", "true");
  });
});
