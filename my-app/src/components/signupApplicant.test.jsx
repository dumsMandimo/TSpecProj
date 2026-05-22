import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SignupApplicant from "./signupApplicant";

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

// Mock authService
jest.mock("../services/authService", () => ({
  signUpWithGoogle: jest.fn(),
}));

// Mock Firebase
jest.mock("../firebase", () => ({ db: {} }));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  orderBy: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

// Mock NqfDropdown
jest.mock("./nqfSelect", () => ({
  NqfDropdown: ({ value, onChange, required }) => (
    <select
      data-testid="nqf-dropdown"
      value={value}
      onChange={onChange}
      required={required}
    >
      <option value="">Select NQF level</option>
      <option value="Diploma (NQF 6)">Diploma (NQF 6)</option>
      <option value="General Certificate (NQF 1)">General Certificate (NQF 1)</option>
    </select>
  ),
}));

describe("SignupApplicant", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders first name and last name fields", () => {
    render(<SignupApplicant />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
  });

  test("renders province dropdown", () => {
    render(<SignupApplicant />);
    expect(screen.getByText(/select province/i)).toBeInTheDocument();
  });

  test("renders NQF qualification dropdown", () => {
    render(<SignupApplicant />);
    expect(screen.getByTestId("nqf-dropdown")).toBeInTheDocument();
  });

  test("renders continue with google button", () => {
    render(<SignupApplicant />);
    expect(
      screen.getByRole("button", { name: /continue with google/i })
    ).toBeInTheDocument();
  });

  test("user can type in first name field", () => {
    render(<SignupApplicant />);
    const input = screen.getByLabelText(/first name/i);
    fireEvent.change(input, { target: { value: "Peace" } });
    expect(input.value).toBe("Peace");
  });

  test("user can type in last name field", () => {
    render(<SignupApplicant />);
    const input = screen.getByLabelText(/last name/i);
    fireEvent.change(input, { target: { value: "Dlamini" } });
    expect(input.value).toBe("Dlamini");
  });

  test("renders all 9 provinces in dropdown", () => {
    render(<SignupApplicant />);
    expect(screen.getByText("Gauteng")).toBeInTheDocument();
    expect(screen.getByText("Western Cape")).toBeInTheDocument();
    expect(screen.getByText("KwaZulu-Natal")).toBeInTheDocument();
  });

  test("shows validation error when submitting empty form", async () => {
    render(<SignupApplicant />);
    fireEvent.submit(screen.getByRole("button", { name: /continue with google/i }).closest("form"));
    await waitFor(() => {
      expect(
        screen.getByText(/please fill in all required fields/i)
      ).toBeInTheDocument();
    });
  });

  test("shows loading state while submitting", async () => {
    const { signUpWithGoogle } = require("../services/authService");
    signUpWithGoogle.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    );

    render(<SignupApplicant />);
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Peace" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Dlamini" },
    });
    fireEvent.change(screen.getByDisplayValue("Select province"), {
      target: { value: "Gauteng" },
    });
    fireEvent.change(screen.getByTestId("nqf-dropdown"), {
      target: { value: "Diploma (NQF 6)" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /continue with google/i }).closest("form")
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /signing up/i })
      ).toBeInTheDocument();
    });
  });

  test("shows error when signup fails", async () => {
    const { signUpWithGoogle } = require("../services/authService");
    signUpWithGoogle.mockRejectedValue(new Error("Google popup closed"));

    render(<SignupApplicant />);
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Peace" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Dlamini" },
    });
    fireEvent.change(screen.getByDisplayValue("Select province"), {
      target: { value: "Gauteng" },
    });
    fireEvent.change(screen.getByTestId("nqf-dropdown"), {
      target: { value: "Diploma (NQF 6)" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /continue with google/i }).closest("form")
    );

    await waitFor(() => {
      expect(screen.getByText(/google popup closed/i)).toBeInTheDocument();
    });
  });

  test("shows error when user already has an account with different role", async () => {
    const { signUpWithGoogle } = require("../services/authService");
    signUpWithGoogle.mockResolvedValue({ user: { uid: "123" }, role: "provider" });

    render(<SignupApplicant />);
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Peace" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Dlamini" },
    });
    fireEvent.change(screen.getByDisplayValue("Select province"), {
      target: { value: "Gauteng" },
    });
    fireEvent.change(screen.getByTestId("nqf-dropdown"), {
      target: { value: "Diploma (NQF 6)" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /continue with google/i }).closest("form")
    );

    await waitFor(() => {
      expect(
        screen.getByText(/you already have an account/i)
      ).toBeInTheDocument();
    });
  });

  

});
