import { render, screen, waitFor } from "@testing-library/react";
import ListingsPanel from "./ListingsPanel";
import { subscribeToProviderListings } from "../../../services/providerService";

jest.mock("../../../services/providerService", () => ({
  subscribeToProviderListings: jest.fn(),
}));

jest.mock("../../../services/firebase", () => ({
  auth: { currentUser: { uid: "provider-uid" } },
}));
const mockListings = [
  { id: "lst-1", title: "Software Internship",   location: "Johannesburg", status: "approved" },
  { id: "lst-2", title: "Business Learnership",  location: "Cape Town",    status: "pending" },
  { id: "lst-3", title: "IT Graduate Programme", location: "Pretoria",     status: "rejected" },
];

const setupListener = (listings = mockListings) => {
  subscribeToProviderListings.mockImplementation((uid, onData) => {
    onData(listings);
    return jest.fn();
  });
};

describe("ListingsPanel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows loading state before data arrives", () => {
    subscribeToProviderListings.mockImplementation(() => jest.fn());
    render(<ListingsPanel />);
    expect(screen.getByText(/loading listings/i)).toBeInTheDocument();
  });

  it("renders listing titles once data is received", () => {
    setupListener();
    render(<ListingsPanel />);
    expect(screen.getByText("Software Internship")).toBeInTheDocument();
    expect(screen.getByText("Business Learnership")).toBeInTheDocument();
    expect(screen.getByText("IT Graduate Programme")).toBeInTheDocument();
  });

  it("renders listing locations", () => {
    setupListener();
    render(<ListingsPanel />);
    expect(screen.getByText("Johannesburg")).toBeInTheDocument();
    expect(screen.getByText("Cape Town")).toBeInTheDocument();
    expect(screen.getByText("Pretoria")).toBeInTheDocument();
  });

  it("renders correct status badge for approved listing", () => {
    setupListener([mockListings[0]]);
    render(<ListingsPanel />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("renders correct status badge for pending listing", () => {
    setupListener([mockListings[1]]);
    render(<ListingsPanel />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders correct status badge for rejected listing", () => {
    setupListener([mockListings[2]]);
    render(<ListingsPanel />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("shows empty state message when there are no listings", () => {
    setupListener([]);
    render(<ListingsPanel />);
    expect(screen.getByText(/no listings yet/i)).toBeInTheDocument();
  });

  it("shows an error message when the listener fails", () => {
    subscribeToProviderListings.mockImplementation((uid, onData, onError) => {
      onError(new Error("Firestore error"));
      return jest.fn();
    });
    render(<ListingsPanel />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/failed to load listings/i)).toBeInTheDocument();
  });

  it("calls unsubscribe on unmount to avoid memory leaks", () => {
    const mockUnsubscribe = jest.fn();
    subscribeToProviderListings.mockReturnValueOnce(mockUnsubscribe);

    const { unmount } = render(<ListingsPanel />);
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("renders the section heading and subtitle", () => {
    setupListener();
    render(<ListingsPanel />);
    expect(screen.getByRole("heading", { name: /my listings/i })).toBeInTheDocument();
    expect(screen.getByText(/manage all your posted opportunities/i)).toBeInTheDocument();
  });
});
