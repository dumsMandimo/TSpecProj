import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PendingApproval from "./providerApproval";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

// MOCKS
jest.mock("firebase/auth", () => ({
  signOut: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

describe("providerApproval Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders pending approval page correctly", () => {
    render(<PendingApproval />);

    expect(screen.getByText(/your account is under review/i)).toBeInTheDocument();
    expect(screen.getByText(/pending approval/i)).toBeInTheDocument();
    expect(screen.getByText(/sign out/i)).toBeInTheDocument();
  });

  test("displays stats correctly", () => {
    render(<PendingApproval />);

    expect(screen.getByText("12k+")).toBeInTheDocument();
    expect(screen.getByText("340+")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  test("calls signOut and navigates to login on sign out click", async () => {
    signOut.mockResolvedValueOnce();

    render(<PendingApproval />);

    const button = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  test("handles signOut error gracefully (no crash)", async () => {
    signOut.mockRejectedValueOnce(new Error("Firebase error"));

    render(<PendingApproval />);

    const button = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
    });

    // component should still not crash
    expect(screen.getByText(/your account is under review/i)).toBeInTheDocument();
  });
});