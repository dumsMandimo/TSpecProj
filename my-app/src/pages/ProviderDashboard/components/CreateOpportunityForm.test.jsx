import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateOpportunityForm from "./CreateOpportunityForm";
import { createOpportunity } from "../../../services/providerService";

jest.mock("../../../services/providerService", () => ({
  createOpportunity: jest.fn(),
}));

jest.mock("../../../services/firebase", () => ({
  auth: { currentUser: { uid: "provider-uid" } },
}));

const fillForm = () => {
  fireEvent.change(screen.getByLabelText(/title/i), {
    target: { value: "Software Internship" },
  });
  fireEvent.change(screen.getByLabelText(/location/i), {
    target: { value: "Johannesburg" },
  });
  fireEvent.change(screen.getByLabelText(/description/i), {
    target: { value: "Great internship opportunity for students." },
  });
};

describe("CreateOpportunityForm", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders all required form fields", () => {
    render(<CreateOpportunityForm />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stipend/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /post opportunity/i })).toBeInTheDocument();
  });

  it("shows validation errors when required fields are empty on submit", async () => {
    render(<CreateOpportunityForm />);
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/location is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });
  });

  it("does not call createOpportunity when validation fails", async () => {
    render(<CreateOpportunityForm />);
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));
    await waitFor(() => expect(createOpportunity).not.toHaveBeenCalled());
  });

  it("clears a field error when the user types into that field", async () => {
    render(<CreateOpportunityForm />);
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));

    await waitFor(() => expect(screen.getByText(/title is required/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "New Title" },
    });

    await waitFor(() =>
      expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument()
    );
  });

  it("calls createOpportunity with correct data when form is valid", async () => {
    createOpportunity.mockResolvedValueOnce("new-opp-id");
    render(<CreateOpportunityForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));

    await waitFor(() =>
      expect(createOpportunity).toHaveBeenCalledWith(
        expect.objectContaining({
          title:       "Software Internship",
          location:    "Johannesburg",
          description: "Great internship opportunity for students.",
          providerUid: "provider-uid",
          status:      "pending",
        })
      )
    );
  });

  it("shows success message after successful submission", async () => {
    createOpportunity.mockResolvedValueOnce("new-opp-id");
    render(<CreateOpportunityForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));

    await waitFor(() =>
      expect(screen.getByText(/posted successfully/i)).toBeInTheDocument()
    );
  });

  it("resets the form fields after successful submission", async () => {
    createOpportunity.mockResolvedValueOnce("new-opp-id");
    render(<CreateOpportunityForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));

    await waitFor(() =>
      expect(screen.getByLabelText(/title/i)).toHaveValue("")
    );
  });

  it("shows an error message when the service call fails", async () => {
    createOpportunity.mockRejectedValueOnce(new Error("Firestore error"));
    render(<CreateOpportunityForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument()
    );
  });

  it("disables the submit button while submitting", async () => {
    createOpportunity.mockReturnValue(new Promise(() => {})); // never resolves
    render(<CreateOpportunityForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /posting/i })).toBeDisabled()
    );
  });
});
