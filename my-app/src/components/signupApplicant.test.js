import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupApplicant from "./signupApplicant";
import { signUpWithGoogle } from "../services/authService";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("../services/authService", () => ({
  signUpWithGoogle: jest.fn(),
}));

jest.mock("../components/nqfSelect.jsx", () => ({
  NqfDropdown: ({ value, onChange }) => (
    <select
      aria-label="Highest qualification"
      value={value}
      onChange={onChange}
    >
      <option value="">Select NQF level</option>
      <option value="NQF 4 — National Certificate (Matric)">
        NQF 4 — National Certificate (Matric)
      </option>
      <option value="NQF 10 — Doctoral Degree">
        NQF 10 — Doctoral Degree
      </option>
    </select>
  ),
}));

describe("SignupApplicant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  test("renders applicant signup form fields", () => {
    render(<SignupApplicant />);

    expect(screen.getByText(/personal details/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/province/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/highest qualification/i)).toBeInTheDocument();
  });

  test("renders province and qualification dropdown defaults", () => {
    render(<SignupApplicant />);

    expect(screen.getByText(/select province/i)).toBeInTheDocument();
    expect(screen.getByText(/select nqf level/i)).toBeInTheDocument();
  });

  test("allows the user to fill in applicant details", () => {
    render(<SignupApplicant />);

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Peace" },
    });

    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Zulu" },
    });

    fireEvent.change(screen.getByLabelText(/province/i), {
      target: { value: "Gauteng" },
    });

    fireEvent.change(screen.getByLabelText(/highest qualification/i), {
      target: { value: "NQF 4 — National Certificate (Matric)" },
    });

    expect(screen.getByLabelText(/first name/i)).toHaveValue("Peace");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Zulu");
    expect(screen.getByLabelText(/province/i)).toHaveValue("Gauteng");
    expect(screen.getByLabelText(/highest qualification/i)).toHaveValue(
      "NQF 4 — National Certificate (Matric)"
    );
  });

  test("successful Google signup calls auth service and navigates to profile creation", async () => {
    signUpWithGoogle.mockResolvedValue({ uid: "test-user-id" });

    render(<SignupApplicant />);

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Peace" },
    });

    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Zulu" },
    });

    fireEvent.change(screen.getByLabelText(/province/i), {
      target: { value: "Gauteng" },
    });

    fireEvent.change(screen.getByLabelText(/highest qualification/i), {
      target: { value: "NQF 4 — National Certificate (Matric)" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /continue with google/i })
    );

    await waitFor(() => {
      expect(signUpWithGoogle).toHaveBeenCalledWith("applicant", {
        firstName: "Peace",
        lastName: "Zulu",
        province: "Gauteng",
        qualification: "NQF 4 — National Certificate (Matric)",
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        "/dashboard/applicant/createProfile"
      );
    });
  });

  test("shows loading text while Google signup is pending", async () => {
    let resolveSignup;

    signUpWithGoogle.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignup = resolve;
        })
    );

    render(<SignupApplicant />);

    fireEvent.click(
      screen.getByRole("button", { name: /continue with google/i })
    );

    expect(
      screen.getByRole("button", { name: /signing in/i })
    ).toBeDisabled();

    resolveSignup({ uid: "abc123" });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/dashboard/applicant/createProfile"
      );
    });
  });

  test("shows an error message when Google signup fails", async () => {
    signUpWithGoogle.mockRejectedValue(new Error("Google popup closed"));

    render(<SignupApplicant />);

    fireEvent.click(
      screen.getByRole("button", { name: /continue with google/i })
    );

    expect(await screen.findByText(/google popup closed/i)).toBeInTheDocument();

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});