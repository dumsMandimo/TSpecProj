import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupApplicant from "./signupApplicant";
import { signUpWithEmail, signUpWithGoogle } from "../services/authService";
import { BrowserRouter } from "react-router-dom";

// ================= MOCKS =================
jest.mock("../services/authService", () => ({
  signUpWithEmail: jest.fn(),
  signUpWithGoogle: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }) => children,
}));

// ✅ FIX: proper localStorage mock
beforeEach(() => {
  jest.clearAllMocks();

  Object.defineProperty(window, "localStorage", {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
});

// ================= HELPER =================
const renderComponent = () => {
  render(
    <BrowserRouter>
      <SignupApplicant />
    </BrowserRouter>
  );
};

// ================= TESTS =================
describe("SignupApplicant", () => {
  test("renders signup form", () => {
    renderComponent();

    expect(screen.getByText("Personal details")).toBeInTheDocument();
    expect(screen.getByText("Create account")).toBeInTheDocument();
    expect(screen.getByText("Sign up with Google")).toBeInTheDocument();
  });

  test("shows error if password is too short", async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "John" },
    });

    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Doe" },
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@test.com" },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "123" },
    });

    fireEvent.click(screen.getByText("Create account"));

    expect(
      await screen.findByText(/at least 6 characters/i)
    ).toBeInTheDocument();
  });

  test("successful signup navigates to applicant dashboard", async () => {
    signUpWithEmail.mockResolvedValue({});

    renderComponent();

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "123456" },
    });

    fireEvent.change(screen.getByLabelText(/province/i), {
      target: { value: "Gauteng" },
    });

    fireEvent.change(screen.getByLabelText(/qualification/i), {
      target: { value: "NQF 4 — National Certificate (Matric)" },
    });

    fireEvent.click(screen.getByText("Create account"));

    await waitFor(() => {
      expect(signUpWithEmail).toHaveBeenCalled();

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "role",
        "applicant"
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        "/dashboard/applicant"
      );
    });
  });

  test("google signup navigates to applicant dashboard", async () => {
    signUpWithGoogle.mockResolvedValue({});

    renderComponent();

    fireEvent.click(screen.getByText("Sign up with Google"));

    await waitFor(() => {
      expect(signUpWithGoogle).toHaveBeenCalled();

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "role",
        "applicant"
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        "/dashboard/applicant"
      );
    });
  });

  test("shows error on signup failure", async () => {
    signUpWithEmail.mockRejectedValue({
      code: "auth/email-already-in-use",
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByText("Create account"));

    expect(
      await screen.findByText(/already exists/i)
    ).toBeInTheDocument();
  });
});