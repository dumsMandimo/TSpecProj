import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import CreateOpportunityForm from "./CreateOpportunityForm";

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock("./CreateOpportunityForm.css", () => {}, { virtual: true });

jest.mock("../../../services/providerService", () => ({
  createOpportunity: jest.fn(),
}));

jest.mock("../../../services/firebase", () => ({
  auth: { currentUser: { uid: "provider-uid-456" } },
}));

import { createOpportunity } from "../../../services/providerService";

// ── Helpers ────────────────────────────────────────────────────────────────

async function fillValidForm(overrides = {}) {
  const fields = {
    title:       "Software Development Learnership",
    location:    "Johannesburg, Gauteng",
    description: "A great learnership opportunity for graduates.",
    closingDate: "2099-12-31",
    ...overrides,
  };

  if (fields.title)
    await userEvent.type(screen.getByLabelText(/title/i), fields.title);
  if (fields.location)
    await userEvent.type(screen.getByLabelText(/location/i), fields.location);
  if (fields.description)
    await userEvent.type(screen.getByLabelText(/description/i), fields.description);
  if (fields.closingDate)
    fireEvent.change(screen.getByLabelText(/closing date/i), {
      target: { value: fields.closingDate },
    });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CreateOpportunityForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createOpportunity.mockResolvedValue({});
  });

  // ── Initial render ─────────────────────────────────────────────────────────

  it("renders the form heading", () => {
    render(<CreateOpportunityForm />);
    expect(screen.getByText("Post New Opportunity")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<CreateOpportunityForm />);
    expect(screen.getByText(/Fill in the details below/i)).toBeInTheDocument();
  });

  it("renders all required fields", () => {
    render(<CreateOpportunityForm />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/closing date/i)).toBeInTheDocument();
  });

  it("renders the optional stipend field", () => {
    render(<CreateOpportunityForm />);
    expect(screen.getByLabelText(/stipend/i)).toBeInTheDocument();
  });

  it("renders the type dropdown with default value 'learnership'", () => {
    render(<CreateOpportunityForm />);
    expect(screen.getByRole("combobox")).toHaveValue("learnership");
  });

  it("type dropdown has all 4 options", () => {
    render(<CreateOpportunityForm />);
    const options = screen.getAllByRole("option");
    const values = options.map((o) => o.value);
    expect(values).toEqual(
      expect.arrayContaining(["learnership", "internship", "apprenticeship", "graduate"])
    );
  });

  it("all inputs start empty", () => {
    render(<CreateOpportunityForm />);
    expect(screen.getByLabelText(/title/i)).toHaveValue("");
    expect(screen.getByLabelText(/location/i)).toHaveValue("");
    expect(screen.getByLabelText(/description/i)).toHaveValue("");
    expect(screen.getByLabelText(/stipend/i)).toHaveValue("");
    expect(screen.getByLabelText(/closing date/i)).toHaveValue("");
  });

  it("renders the submit button labelled 'Post Opportunity'", () => {
    render(<CreateOpportunityForm />);
    expect(screen.getByRole("button", { name: /post opportunity/i })).toBeInTheDocument();
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  it("shows all required-field errors when submitted empty", async () => {
    render(<CreateOpportunityForm />);
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/location is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/closing date is required/i)).toBeInTheDocument();
    });
  });

  it("does not call createOpportunity when validation fails", async () => {
    render(<CreateOpportunityForm />);
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));
    await waitFor(() => expect(createOpportunity).not.toHaveBeenCalled());
  });

  it("clears a field's error when the user starts typing", async () => {
    render(<CreateOpportunityForm />);
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));
    await waitFor(() => screen.getByText(/title is required/i));

    await userEvent.type(screen.getByLabelText(/title/i), "A");
    expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
  });

  it("does not show validation errors before first submission attempt", () => {
    render(<CreateOpportunityForm />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // ── Successful submission ──────────────────────────────────────────────────

  it("calls createOpportunity with the correct payload on valid submission", async () => {
    render(<CreateOpportunityForm />);
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));

    await waitFor(() => {
      expect(createOpportunity).toHaveBeenCalledWith(
        expect.objectContaining({
          title:       "Software Development Learnership",
          location:    "Johannesburg, Gauteng",
          description: "A great learnership opportunity for graduates.",
          closingDate: "2099-12-31",
          providerUid: "provider-uid-456",
          status:      "pending",
        })
      );
    });
  });

  it("shows the success message after a successful submission", async () => {
    render(<CreateOpportunityForm />);
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/opportunity posted successfully/i)
    );
  });

  it("resets the form to empty values after a successful submission", async () => {
    render(<CreateOpportunityForm />);
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));
    await waitFor(() => screen.getByRole("status"));

    expect(screen.getByLabelText(/title/i)).toHaveValue("");
    expect(screen.getByLabelText(/location/i)).toHaveValue("");
    expect(screen.getByLabelText(/description/i)).toHaveValue("");
  });

  it("shows 'Posting...' on the submit button during submission", async () => {
    createOpportunity.mockReturnValue(new Promise(() => {})); // never resolves
    render(<CreateOpportunityForm />);
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /posting/i })).toBeDisabled()
    );
  });

  // ── Failed submission ──────────────────────────────────────────────────────

  it("shows a submit error when createOpportunity rejects", async () => {
    createOpportunity.mockRejectedValue(new Error("server error"));
    render(<CreateOpportunityForm />);
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to post opportunity/i)
    );
  });

  it("re-enables the submit button after a failed submission", async () => {
    createOpportunity.mockRejectedValue(new Error("server error"));
    render(<CreateOpportunityForm />);
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /post opportunity/i })).not.toBeDisabled()
    );
  });

  // ── Field interactions ─────────────────────────────────────────────────────

  it("allows the user to change the type dropdown", async () => {
    render(<CreateOpportunityForm />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "internship");
    expect(screen.getByRole("combobox")).toHaveValue("internship");
  });

  it("allows typing in the stipend field", async () => {
    render(<CreateOpportunityForm />);
    await userEvent.type(screen.getByLabelText(/stipend/i), "R5 000/month");
    expect(screen.getByLabelText(/stipend/i)).toHaveValue("R5 000/month");
  });

  it("clears the success message when user starts editing after a success", async () => {
    render(<CreateOpportunityForm />);
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));
    await waitFor(() => screen.getByRole("status"));

    await userEvent.type(screen.getByLabelText(/title/i), "X");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it("renders a <fieldset> with legend 'Opportunity details'", () => {
    const { container } = render(<CreateOpportunityForm />);
    expect(container.querySelector("fieldset")).toBeInTheDocument();
    expect(screen.getByText(/opportunity details/i)).toBeInTheDocument();
  });

  it("closing date input has a min attribute set to today or earlier", () => {
    render(<CreateOpportunityForm />);
    const input = screen.getByLabelText(/closing date/i);
    expect(input).toHaveAttribute("min");
  });

  it("required fields have aria-required='true'", () => {
    render(<CreateOpportunityForm />);
    expect(screen.getByLabelText(/title/i)).toHaveAttribute("aria-required", "true");
    expect(screen.getByLabelText(/location/i)).toHaveAttribute("aria-required", "true");
    expect(screen.getByLabelText(/description/i)).toHaveAttribute("aria-required", "true");
    expect(screen.getByLabelText(/closing date/i)).toHaveAttribute("aria-required", "true");
  });

  it("submit button has aria-busy='true' while submitting", async () => {
    createOpportunity.mockReturnValue(new Promise(() => {}));
    render(<CreateOpportunityForm />);
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /posting/i })).toHaveAttribute("aria-busy", "true")
    );
  });
});