import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupAdmin from "./signupAdmin";
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

// ================= LOCAL STORAGE MOCK =================
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
      <SignupAdmin />
    </BrowserRouter>
  );
};

// ================= TESTS =================
describe("SignupAdmin", () => {
  test("renders signup form", () => {
    renderComponent();

    expect(screen.getByText("Admin details")).toBeInTheDocument();
    expect(screen.getByText("Create admin account")).toBeInTheDocument();
    expect(screen.getByText("Sign up with Google")).toBeInTheDocument();
  });

  test("shows error if passwords do not match", async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Admin User" },
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@test.com" },
    });

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "123456" },
    });

    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "999999" },
    });

    fireEvent.click(screen.getByText("Create admin account"));

    expect(
      await screen.findByText(/passwords do not match/i)
    ).toBeInTheDocument();
  });

  test("shows error if password too short", async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "123" },
    });

    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "123" },
    });

    fireEvent.click(screen.getByText("Create admin account"));

    expect(
      await screen.findByText(/at least 6 characters/i)
    ).toBeInTheDocument();
  });

  test("successful signup navigates to admin dashboard", async () => {
    signUpWithEmail.mockResolvedValue({});

    renderComponent();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Admin User" },
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@test.com" },
    });

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "123456" },
    });

    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByText("Create admin account"));

    await waitFor(() => {
      expect(signUpWithEmail).toHaveBeenCalled();

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "role",
        "admin"
      );

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin");
    });
  });

  test("google signup navigates to admin dashboard", async () => {
    signUpWithGoogle.mockResolvedValue({});

    renderComponent();

    fireEvent.click(screen.getByText("Sign up with Google"));

    await waitFor(() => {
      expect(signUpWithGoogle).toHaveBeenCalled();

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "role",
        "admin");

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin");
    });
  });

  test("shows error on signup failure", async () => {
    signUpWithEmail.mockRejectedValue({
      code: "auth/email-already-in-use",
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Admin User" },
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@test.com" },
    });

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "123456" },
    });

    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByText("Create admin account"));

    expect(
      await screen.findByText(/already exists/i)
    ).toBeInTheDocument();
  });
});