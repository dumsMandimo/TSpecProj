// ================= TEST EXTENSIONS =================
import "@testing-library/jest-dom";

// ================= REACT TESTING LIBRARY =================
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ================= COMPONENT =================
import LoginPage from "./loginPage";

// ================= MOCKS (MUST COME BEFORE FIREBASE IMPORTS) =================

// Firebase auth mock
jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  getAuth: jest.fn(() => ({})),
  GoogleAuthProvider: jest.fn(),
}));

// User service mock
jest.mock("../services/userService", () => ({
  getUserRole: jest.fn(),
}));

// React Router mock
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }) => children,
}));

// ================= IMPORT MOCKED FUNCTIONS =================
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

import { getUserRole } from "../services/userService";

// ================= GLOBAL MOCKS =================
global.alert = jest.fn();

// ================= HELPER =================
const renderComponent = () => {
  render(<LoginPage />);
};

// ================= TESTS =================
describe("LoginPage Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders login form", () => {
    renderComponent();

    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByDisplayValue("LOGIN")).toBeInTheDocument();
  });

  test("shows alert if email or password missing", () => {
    renderComponent();

    fireEvent.click(screen.getByDisplayValue("LOGIN"));

    expect(global.alert).toHaveBeenCalledWith(
      "Please enter email and password"
    );
  });

  test("logs in admin and navigates correctly", async () => {
    renderComponent();

    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "123" },
    });

    getUserRole.mockResolvedValue("admin");

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByDisplayValue("LOGIN"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin");
    });
  });

  test("navigates to provider dashboard", async () => {
    renderComponent();

    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "123" },
    });

    getUserRole.mockResolvedValue("provider");

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByDisplayValue("LOGIN"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/provider");
    });
  });

  test("navigates to applicant dashboard", async () => {
    renderComponent();

    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "123" },
    });

    getUserRole.mockResolvedValue("applicant");

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByDisplayValue("LOGIN"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/applicant");
    });
  });

  test("shows alert on login failure", async () => {
    renderComponent();

    signInWithEmailAndPassword.mockRejectedValue({
      code: "auth/invalid-credential",
    });

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByDisplayValue("LOGIN"));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        "Invalid email or password."
      );
    });
  });

  test("sends password reset email", async () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@test.com" },
    });

    fireEvent.click(screen.getByText("Forgot password?"));

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalled();
    });
  });

  test("alerts if forgot password clicked without email", () => {
    renderComponent();

    fireEvent.click(screen.getByText("Forgot password?"));

    expect(global.alert).toHaveBeenCalledWith(
      "Please enter your email first"
    );
  });
});