// src/components/signupApplicant.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupApplicant from "./signupApplicant";

// Mock navigation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

//  Don't reference a variable inside jest.mock() — it gets hoisted before const declarations
jest.mock("../services/authService", () => ({
  signUpWithGoogle: jest.fn(),
}));
//  Import the mock AFTER jest.mock() so we can configure it per test
import { signUpWithGoogle } from "../services/authService";

//  Mock NqfDropdown so we can interact with it via fireEvent.change
jest.mock("./nqfSelect", () => ({
  NqfDropdown: ({ value, onChange, required }) => (
    <select
      aria-label="Qualification"
      value={value}
      onChange={onChange}
      required={required}
    >
      <option value="">Select NQF level</option>
      <option value="NQF 7 — Bachelor's Degree">NQF 7 — Bachelor's Degree</option>
    </select>
  ),
}));

describe("SignupApplicant Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders form fields and Google button", () => {
    render(<SignupApplicant />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/province/i)).toBeInTheDocument();
    //  The mocked dropdown renders a <select> with this placeholder option
    expect(screen.getByText(/select nqf level/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i })
    ).toBeInTheDocument();
  });

  test("user can type in first name, last name, and select province", () => {
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

    expect(screen.getByLabelText(/first name/i).value).toBe("Peace");
    expect(screen.getByLabelText(/last name/i).value).toBe("Zulu");
    expect(screen.getByLabelText(/province/i).value).toBe("Gauteng");
  });

  test("user can select NQF level", () => {
    render(<SignupApplicant />);
    // With the mocked <select>, just fire a change event directly
    fireEvent.change(screen.getByLabelText(/qualification/i), {
      target: { value: "NQF 7 — Bachelor's Degree" },
    });
    expect(screen.getByLabelText(/qualification/i).value).toBe(
      "NQF 7 — Bachelor's Degree"
    );
  });

  test("successful Google signup calls authService and navigates", async () => {
    signUpWithGoogle.mockResolvedValue({
      user: { uid: "123" },
      role: "applicant",
      existingUser: false,
    });

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
    // Select NQF via the mocked <select>
    fireEvent.change(screen.getByLabelText(/qualification/i), {
      target: { value: "NQF 7 — Bachelor's Degree" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /continue with google/i })
    );

    await waitFor(() => {
      expect(signUpWithGoogle).toHaveBeenCalledWith("applicant", {
        firstName: "Peace",
        lastName: "Zulu",
        province: "Gauteng",
        qualification: "NQF 7 — Bachelor's Degree",
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        "/dashboard/applicant/createProfile"
      );
    });
  });

  test("shows error when Google signup fails", async () => {
    signUpWithGoogle.mockRejectedValue(new Error("Popup closed"));

    render(<SignupApplicant />);
    // Validation passes because the error comes from the thrown rejection,
    // but we need all fields filled first — otherwise validation blocks the call
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Peace" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Zulu" },
    });
    fireEvent.change(screen.getByLabelText(/province/i), {
      target: { value: "Gauteng" },
    });
    fireEvent.change(screen.getByLabelText(/qualification/i), {
      target: { value: "NQF 7 — Bachelor's Degree" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /continue with google/i })
    );

    expect(await screen.findByText(/popup closed/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});