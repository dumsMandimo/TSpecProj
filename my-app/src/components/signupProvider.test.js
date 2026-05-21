// src/components/signupProvider.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupProvider from "./signupProvider";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("../services/authService", () => ({
  signUpWithGoogle: jest.fn(),
}));
import { signUpWithGoogle } from "../services/authService";

// ✅ Replace SectorDropdown with a plain <select> so fireEvent.change works
jest.mock("./nqfSelect", () => ({
  SectorDropdown: ({ value, onChange, required }) => (
    <select
      aria-label="Sector"
      value={value}
      onChange={onChange}
      required={required}
    >
      <option value="">Select sector</option>
      <option value="Education">Education</option>
      <option value="Health">Health</option>
      <option value="Technology">Technology</option>
    </select>
  ),
}));

describe("SignupProvider Tests", () => {
  const renderComponent = () => render(<SignupProvider />);

  const fillRequiredFields = () => {
    fireEvent.change(screen.getByLabelText(/organisation name/i), {
      target: { value: "Test Org" },
    });
    fireEvent.change(screen.getByLabelText(/contact person/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/sector/i), {
      target: { value: "Education" },
    });
    fireEvent.change(screen.getByLabelText(/province/i), {
      target: { value: "Gauteng" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "We provide learnerships" },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders all form fields", () => {
    renderComponent();
    expect(screen.getByLabelText(/organisation name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sector/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/province/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  test("renders continue with google button", () => {
    renderComponent();
    expect(
      screen.getByRole("button", { name: /continue with google/i })
    ).toBeInTheDocument();
  });

  test("shows field-specific errors if fields are empty on submit", async () => {
    renderComponent();
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/organisation name is required/i)
      ).toBeInTheDocument();
    });
  });

  test("successful signup navigates to provider dashboard", async () => {
    signUpWithGoogle.mockResolvedValue({
      user: { uid: "123" },
      role: "provider",
      existingUser: false,
    });

    renderComponent();
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(signUpWithGoogle).toHaveBeenCalledWith("provider", {
        organisationName: "Test Org",
        contactName: "John Doe",
        sector: "Education",
        province: "Gauteng",
        description: "We provide learnerships",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/pending-approval");
    });
  });

  test("shows error if user already has an account with different role", async () => {
    signUpWithGoogle.mockResolvedValue({
      user: { uid: "123" },
      role: "applicant",
      existingUser: true,
    });

    renderComponent();
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/you already have an account/i)
      ).toBeInTheDocument();
    });
  });

  test("shows generic error message on signup failure", async () => {
    signUpWithGoogle.mockRejectedValue(new Error("Signup failed"));

    renderComponent();
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(screen.getByText(/signup failed/i)).toBeInTheDocument();
    });
  });
});