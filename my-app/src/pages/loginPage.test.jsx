import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "./loginPage";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("../services/authService", () => ({
  signUpWithGoogle: jest.fn(),
}));

import { signUpWithGoogle } from "../services/authService";

global.alert = jest.fn();

const renderComponent = () => render(<LoginPage />);

describe("LoginPage Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // UAT 2.1 — Login page renders correctly
  test("renders sign in button", () => {
    renderComponent();
    expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
  });

  // UAT 2.1 — Admin redirects to admin dashboard
  test("redirects admin to admin dashboard", async () => {
    signUpWithGoogle.mockResolvedValue({ role: "admin" });
    renderComponent();

    fireEvent.click(screen.getByText("Sign in with Google"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin");
    });
  });

  // UAT 2.1 — Provider redirects to provider dashboard
  test("redirects provider to provider dashboard", async () => {
    signUpWithGoogle.mockResolvedValue({ role: "provider" });
    renderComponent();

    fireEvent.click(screen.getByText("Sign in with Google"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/provider-dashboard");
    });
  });

  // UAT 2.1 — Applicant redirects to applicant dashboard
  test("redirects applicant to applicant dashboard", async () => {
    signUpWithGoogle.mockResolvedValue({ role: "applicant" });
    renderComponent();

    fireEvent.click(screen.getByText("Sign in with Google"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/applicant-dashboard");
    });
  });

  // UAT 2.2 — Unknown role shows alert
  test("shows alert for unknown role", async () => {
    signUpWithGoogle.mockResolvedValue({ role: "unknown" });
    renderComponent();

    fireEvent.click(screen.getByText("Sign in with Google"));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Unknown role. Contact support.");
    });
  });

  // UAT 2.2 — Failed login shows error alert
  test("shows alert on login failure", async () => {
    signUpWithGoogle.mockRejectedValue(new Error("Google login failed. Please try again."));
    renderComponent();

    fireEvent.click(screen.getByText("Sign in with Google"));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Google login failed. Please try again.");
    });
  });

  // UAT 2.1 — Button shows loading state while signing in
  test("shows loading state while signing in", async () => {
    signUpWithGoogle.mockImplementation(() => new Promise(() => {}));
    renderComponent();

    fireEvent.click(screen.getByText("Sign in with Google"));

    await waitFor(() => {
      expect(screen.getByText("Signing in...")).toBeInTheDocument();
    });
  });
});