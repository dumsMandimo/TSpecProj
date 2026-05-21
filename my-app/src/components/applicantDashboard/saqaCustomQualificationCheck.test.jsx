import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SaqaCustomQualificationCheck from "./saqaCustomQualificationCheck";
import { verifyQualificationAgainstSaqa } from "../../services/saqaVerificationService";
jest.mock("../../services/saqaVerificationService", () => ({
  verifyQualificationAgainstSaqa: jest.fn(),
}));
describe("SaqaCustomQualificationCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const getQualificationInput = () =>
    screen.getByLabelText(/Enter qualification name/i);
  const getCheckButton = () =>
    screen.getByRole("button", { name: /Check against SAQA records/i });
  test("renders input and check button", () => {
    render(<SaqaCustomQualificationCheck />);
    expect(getQualificationInput()).toBeInTheDocument();
    expect(getCheckButton()).toBeInTheDocument();
    expect(getCheckButton()).toBeDisabled();
  });
  test("enables check button when qualification text is entered", () => {
    render(<SaqaCustomQualificationCheck />);
    fireEvent.change(getQualificationInput(), {
      target: { value: "Diploma in Software Development" },
    });
    expect(getCheckButton()).not.toBeDisabled();
  });
  test("keeps check button disabled for whitespace-only input", () => {
    render(<SaqaCustomQualificationCheck />);
    fireEvent.change(getQualificationInput(), {
      target: { value: "   " },
    });
    expect(getCheckButton()).toBeDisabled();
  });
  test("calls onCustomChange when user types", () => {
    const onCustomChange = jest.fn();
    render(
      <SaqaCustomQualificationCheck onCustomChange={onCustomChange} />
    );
    fireEvent.change(getQualificationInput(), {
      target: { value: "Diploma in IT" },
    });
    expect(onCustomChange).toHaveBeenCalledWith("Diploma in IT");
  });
  test("clears previous SAQA result when user edits the input", async () => {
    verifyQualificationAgainstSaqa.mockResolvedValue({
      status: "matched",
      bestMatch: { title: "National Diploma: Software Development" },
      matches: [],
      matchScore: 95,
    });
    render(<SaqaCustomQualificationCheck />);
    fireEvent.change(getQualificationInput(), {
      target: { value: "Software Development" },
    });
    fireEvent.click(getCheckButton());
    await waitFor(() => {
      expect(screen.getByText(/SAQA record match found/i)).toBeInTheDocument();
    });
    fireEvent.change(getQualificationInput(), {
      target: { value: "Updated qualification" },
    });
    expect(screen.queryByText(/SAQA record match found/i)).not.toBeInTheDocument();
  });
  test("calls SAQA verification with sector and NQF props", async () => {
    verifyQualificationAgainstSaqa.mockResolvedValue({
      status: "not_found",
      bestMatch: null,
      matches: [],
      matchScore: 0,
    });
    render(
      <SaqaCustomQualificationCheck
        selectedSector="Technology"
        selectedNqfLevel={6}
      />
    );
    fireEvent.change(getQualificationInput(), {
      target: { value: "Custom Qualification" },
    });
    fireEvent.click(getCheckButton());
    await waitFor(() => {
      expect(verifyQualificationAgainstSaqa).toHaveBeenCalledWith(
        "Custom Qualification",
        {
          selectedSector: "Technology",
          selectedNqfLevel: 6,
        }
      );
    });
  });
  test("shows matched message when status is matched", async () => {
    verifyQualificationAgainstSaqa.mockResolvedValue({
      status: "matched",
      bestMatch: { title: "National Diploma: Software Development" },
      matches: [],
      matchScore: 95,
    });
    const onVerificationChange = jest.fn();
    render(
      <SaqaCustomQualificationCheck
        onVerificationChange={onVerificationChange}
      />
    );
    fireEvent.change(getQualificationInput(), {
      target: { value: "Software Development" },
    });
    fireEvent.click(getCheckButton());
    await waitFor(() => {
      expect(screen.getByText(/SAQA record match found/i)).toBeInTheDocument();
      expect(
        screen.getByText(/National Diploma: Software Development/i)
      ).toBeInTheDocument();
    });
    expect(onVerificationChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: "matched" })
    );
  });
  test("uses bestMatch label when title is missing", async () => {
    verifyQualificationAgainstSaqa.mockResolvedValue({
      status: "matched",
      bestMatch: { label: "Diploma Label From SAQA" },
      matches: [],
      matchScore: 90,
    });
    render(<SaqaCustomQualificationCheck />);
    fireEvent.change(getQualificationInput(), {
      target: { value: "Some qualification" },
    });
    fireEvent.click(getCheckButton());
    await waitFor(() => {
      expect(screen.getByText(/Diploma Label From SAQA/i)).toBeInTheDocument();
    });
  });
  test("shows possible match UI and calls onUseMatch when accepted", async () => {
    const bestMatch = { title: "Possible SAQA Qualification" };
    const result = {
      status: "possible_match",
      bestMatch,
      matches: [bestMatch],
      matchScore: 72,
    };
    verifyQualificationAgainstSaqa.mockResolvedValue(result);
    const onUseMatch = jest.fn();
    render(
      <SaqaCustomQualificationCheck onUseMatch={onUseMatch} />
    );
    fireEvent.change(getQualificationInput(), {
      target: { value: "Possible qualification" },
    });
    fireEvent.click(getCheckButton());
    await waitFor(() => {
      expect(screen.getByText(/Possible SAQA match/i)).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Yes, use this SAQA match/i })
    );
    expect(onUseMatch).toHaveBeenCalledWith(bestMatch, result);
  });
  test("shows not found message when status is not_found", async () => {
    verifyQualificationAgainstSaqa.mockResolvedValue({
      status: "not_found",
      bestMatch: null,
      matches: [],
      matchScore: 0,
    });
    render(<SaqaCustomQualificationCheck />);
    fireEvent.change(getQualificationInput(), {
      target: { value: "Unknown qualification" },
    });
    fireEvent.click(getCheckButton());
    await waitFor(() => {
      expect(
        screen.getByText(/No SAQA record match found in the current dataset/i)
      ).toBeInTheDocument();
    });
  });
  test("shows error message and notifies parent when verification fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    verifyQualificationAgainstSaqa.mockRejectedValue(
      new Error("Network failure")
    );
    const onVerificationChange = jest.fn();
    render(
      <SaqaCustomQualificationCheck
        onVerificationChange={onVerificationChange}
      />
    );
    fireEvent.change(getQualificationInput(), {
      target: { value: "Broken check qualification" },
    });
    fireEvent.click(getCheckButton());
    await waitFor(() => {
      expect(
        screen.getByText(/Could not check SAQA records right now/i)
      ).toBeInTheDocument();
    });
    expect(onVerificationChange).toHaveBeenCalledWith({
      status: "error",
      bestMatch: null,
      matches: [],
      matchScore: 0,
    });
    consoleSpy.mockRestore();
  });
  test("shows checking state while verification is in progress", async () => {
    let resolveVerification;
    verifyQualificationAgainstSaqa.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveVerification = resolve;
        })
    );
    render(<SaqaCustomQualificationCheck />);
    fireEvent.change(getQualificationInput(), {
      target: { value: "Slow qualification" },
    });
    fireEvent.click(getCheckButton());
    expect(screen.getByText("Checking SAQA...")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Checking SAQA/i })
    ).toBeDisabled();
    resolveVerification({
      status: "not_found",
      bestMatch: null,
      matches: [],
      matchScore: 0,
    });
    await waitFor(() => {
      expect(screen.getByText(/Check against SAQA records/i)).toBeInTheDocument();
    });
  });
});