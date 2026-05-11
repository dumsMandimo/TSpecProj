import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupProvider from "./signupProvider";
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

global.localStorage = {
  setItem: jest.fn(),
};

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
};

// ================= RENDER =================
const renderComponent = () => {
  render(
    <BrowserRouter>
      <SignupProvider />
    </BrowserRouter>
  );
};

// ================= TESTS =================
describe("SignupProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- RENDER ----------------
  test("renders provider signup form", () => {
    renderComponent();

    expect(screen.getByText("Organisation details")).toBeInTheDocument();
    expect(screen.getByText("Login details")).toBeInTheDocument();
    expect(screen.getByText("Register organisation")).toBeInTheDocument();
  });

  // ---------------- PASSWORD VALIDATION ----------------
  test("shows error if password is too short", async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Work email/i), {
      target: { value: "provider@test.com" },
    });

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "123" }, // too short
    });

    fireEvent.click(screen.getByText("Register organisation"));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  // ---------------- SUCCESS SIGNUP ----------------
  test("successful signup navigates to provider dashboard", async () => {
    signUpWithEmail.mockResolvedValue({ user: { uid: "123" } });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/Organisation name/i), {
      target: { value: "Test Org" },
    });

    fireEvent.change(screen.getByLabelText(/Contact person/i), {
      target: { value: "John Doe" },
    });

    fireEvent.change(screen.getByLabelText(/Sector/i), {
      target: { value: "ICT" },
    });

    fireEvent.change(screen.getByLabelText(/Province/i), {
      target: { value: "Gauteng" },
    });

    fireEvent.change(screen.getByLabelText(/Work email/i), {
      target: { value: "provider@test.com" },
    });

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "12345678" },
    });

    fireEvent.click(screen.getByText("Register organisation"));

    await waitFor(() => {
      expect(signUpWithEmail).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/provider");
    });
  });

  // ---------------- GOOGLE SIGNUP ----------------
  test("google signup navigates to provider dashboard", async () => {
    signUpWithGoogle.mockResolvedValue({ user: { uid: "google123" } });

    renderComponent();

    fireEvent.click(screen.getByText("Sign up with Google"));

    await waitFor(() => {
      expect(signUpWithGoogle).toHaveBeenCalledWith("provider");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/provider");
    });
  });

  // ---------------- ERROR HANDLING ----------------
  test("shows error on signup failure", async () => {
    signUpWithEmail.mockRejectedValue({
      code: "auth/email-already-in-use",
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/Work email/i), {
      target: { value: "provider@test.com" },
    });

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "12345678" },
    });

    fireEvent.click(screen.getByText("Register organisation"));

    expect(
      await screen.findByText(/already exists/i)
    ).toBeInTheDocument();
  });
});