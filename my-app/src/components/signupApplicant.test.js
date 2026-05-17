import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupApplicant from "./signupApplicant";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("../services/authService", () => ({
  signUpWithGoogle: jest.fn(),
}));

import { signUpWithGoogle } from "../services/authService";

const renderComponent = () => render(<SignupApplicant />);

describe("SignupApplicant Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Renders correctly
  test("renders all form fields", () => {
    renderComponent();
    expect(screen.getByText("Personal details")).toBeInTheDocument();
    expect(screen.getByText(/First name/i)).toBeInTheDocument();
    expect(screen.getByText(/Last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Province/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Qualification/i)).toBeInTheDocument();
  });

  // Renders button
  test("renders continue with google button", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: /Continue with Google/i })).toBeInTheDocument();
  });

  // UAT 2.2 — Shows error if fields are empty
  test("shows error if fields are empty on submit", async () => {
    renderComponent();
    fireEvent.click(screen.getByRole("button", { name: /Continue with Google/i }));
    expect(await screen.findByText("Please fill in all required fields before continuing.")).toBeInTheDocument();
  });

  // UAT 2.1 — Successful applicant signup navigates to applicant dashboard
  test("successful signup navigates to applicant dashboard", async () => {
    signUpWithGoogle.mockResolvedValue({ user: { uid: "123" }, role: "applicant" });
    renderComponent();

    fireEvent.change(screen.getByLabelText(/First name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Last name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Province/i), {
      target: { value: "Gauteng" },
    });
    fireEvent.change(screen.getByLabelText(/Qualification/i), {
      target: { value: "NQF 4 — National Certificate (Matric)" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Continue with Google/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/applicant-dashboard");
    });
  });

  // UAT 2.3 — Duplicate account shows error
  test("shows error if user already has an account with different role", async () => {
    signUpWithGoogle.mockResolvedValue({ user: { uid: "123" }, role: "provider" });
    renderComponent();

    fireEvent.change(screen.getByLabelText(/First name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Last name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Province/i), {
      target: { value: "Gauteng" },
    });
    fireEvent.change(screen.getByLabelText(/Qualification/i), {
      target: { value: "NQF 4 — National Certificate (Matric)" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Continue with Google/i }));

    await waitFor(() => {
      expect(screen.getByText("You already have an account. Please use the login page.")).toBeInTheDocument();
    });
  });

  // UAT 2.2 — Signup failure shows error
  test("shows error message on signup failure", async () => {
    signUpWithGoogle.mockRejectedValue(new Error("Signup failed. Please try again."));
    renderComponent();

    fireEvent.change(screen.getByLabelText(/First name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Last name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Province/i), {
      target: { value: "Gauteng" },
    });
    fireEvent.change(screen.getByLabelText(/Qualification/i), {
      target: { value: "NQF 4 — National Certificate (Matric)" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Continue with Google/i }));

    await waitFor(() => {
      expect(screen.getByText("Signup failed. Please try again.")).toBeInTheDocument();
    });
  });
});