import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ApplicationsPanel from "./ApplicationsPanel";
import { subscribeToProviderApplications, updateApplicationStatus } from "../../../services/providerService";

jest.mock("../services/providerService", () => ({
  subscribeToProviderApplications: jest.fn(),
  updateApplicationStatus:         jest.fn(),
}));

jest.mock("../services/firebase", () => ({
  auth: { currentUser: { uid: "provider-uid" } },
}));

const mockApplications = [
  { id: "app-1", applicantName: "John Doe",   opportunityTitle: "Software Internship", status: "received" },
  { id: "app-2", applicantName: "Sarah Kim",  opportunityTitle: "Business Learnership", status: "shortlisted" },
];

const setupListener = (apps = mockApplications) => {
  subscribeToProviderApplications.mockImplementation((uid, onData) => {
    onData(apps);
    return jest.fn(); // unsubscribe mock
  });
};

describe("ApplicationsPanel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders a loading state initially before data arrives", () => {
    subscribeToProviderApplications.mockImplementation(() => jest.fn());
    render(<ApplicationsPanel />);
    expect(screen.getByText(/loading applications/i)).toBeInTheDocument();
  });

  it("renders applicant names once data is received", () => {
    setupListener();
    render(<ApplicationsPanel />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Sarah Kim")).toBeInTheDocument();
  });

  it("shows opportunity title for each application", () => {
    setupListener();
    render(<ApplicationsPanel />);
    expect(screen.getByText(/software internship/i)).toBeInTheDocument();
    expect(screen.getByText(/business learnership/i)).toBeInTheDocument();
  });

  it("shows an empty state message when there are no applications", () => {
    setupListener([]);
    render(<ApplicationsPanel />);
    expect(screen.getByText(/no applications received yet/i)).toBeInTheDocument();
  });

  it("calls updateApplicationStatus with 'accepted' when Accept is clicked", async () => {
    updateApplicationStatus.mockResolvedValueOnce(undefined);
    setupListener();
    render(<ApplicationsPanel />);

    const acceptButtons = screen.getAllByRole("button", { name: /accept/i });
    fireEvent.click(acceptButtons[0]);

    await waitFor(() =>
      expect(updateApplicationStatus).toHaveBeenCalledWith("app-1", "accepted")
    );
  });

  it("calls updateApplicationStatus with 'rejected' when Reject is clicked", async () => {
    updateApplicationStatus.mockResolvedValueOnce(undefined);
    setupListener();
    render(<ApplicationsPanel />);

    const rejectButtons = screen.getAllByRole("button", { name: /reject/i });
    fireEvent.click(rejectButtons[0]);

    await waitFor(() =>
      expect(updateApplicationStatus).toHaveBeenCalledWith("app-1", "rejected")
    );
  });

  it("calls updateApplicationStatus with 'shortlisted' when Shortlist is clicked", async () => {
    updateApplicationStatus.mockResolvedValueOnce(undefined);
    setupListener();
    render(<ApplicationsPanel />);

    const shortlistButtons = screen.getAllByRole("button", { name: /shortlist/i });
    fireEvent.click(shortlistButtons[0]);

    await waitFor(() =>
      expect(updateApplicationStatus).toHaveBeenCalledWith("app-1", "shortlisted")
    );
  });

  it("shows an error message when updateApplicationStatus fails", async () => {
    updateApplicationStatus.mockRejectedValueOnce(new Error("Network error"));
    setupListener();
    render(<ApplicationsPanel />);

    const acceptButtons = screen.getAllByRole("button", { name: /accept/i });
    fireEvent.click(acceptButtons[0]);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument()
    );
  });

  it("calls the unsubscribe function on unmount", () => {
    const mockUnsubscribe = jest.fn();
    subscribeToProviderApplications.mockReturnValueOnce(mockUnsubscribe);

    const { unmount } = render(<ApplicationsPanel />);
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
