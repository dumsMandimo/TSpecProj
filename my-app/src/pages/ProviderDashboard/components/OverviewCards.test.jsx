import { render, screen, waitFor } from "@testing-library/react";
import OverviewCards from "./OverviewCards";
import { getProviderStats } from "../../../services/providerService";

jest.mock("../../../services/providerService", () => ({
  getProviderStats: jest.fn(),
}));

jest.mock("../../../services/firebase", () => ({
  auth: { currentUser: { uid: "test-uid" } },
}));
describe("OverviewCards", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows a loading message while data is being fetched", () => {
    getProviderStats.mockReturnValue(new Promise(() => {})); // never resolves
    render(<OverviewCards />);
    expect(screen.getByText(/loading stats/i)).toBeInTheDocument();
  });

  it("renders four stat cards with correct values after data loads", async () => {
    getProviderStats.mockResolvedValueOnce({
      listings: 5, applications: 20, shortlisted: 8, accepted: 3,
    });

    render(<OverviewCards />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("20")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  it("renders the correct stat labels", async () => {
    getProviderStats.mockResolvedValueOnce({
      listings: 0, applications: 0, shortlisted: 0, accepted: 0,
    });

    render(<OverviewCards />);

    await waitFor(() => {
      expect(screen.getByText(/total listings/i)).toBeInTheDocument();
      expect(screen.getByText(/applications/i)).toBeInTheDocument();
      expect(screen.getByText(/shortlisted/i)).toBeInTheDocument();
      expect(screen.getByText(/accepted/i)).toBeInTheDocument();
    });
  });

  it("shows an error message when the service call fails", async () => {
    getProviderStats.mockRejectedValueOnce(new Error("Network error"));

    render(<OverviewCards />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/failed to load stats/i)).toBeInTheDocument();
    });
  });
});
