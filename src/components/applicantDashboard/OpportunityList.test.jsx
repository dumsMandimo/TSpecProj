import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OpportunityList from "./OpportunityList";

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children }) => children,
}));

jest.mock("../../firebase", () => ({
  db: {},
  auth: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: { now: jest.fn(() => ({ seconds: 1234567890 })) },
  getFirestore: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));

const mockOpportunities = [
  {
    id: "opp1",
    title: "Software Internship",
    description: "A great internship opportunity",
    location: "Johannesburg",
    stipend: "R5000/month",
    closingDate: "2025-12-31",
    company: "TechCorp",
    companyUrl: "https://techcorp.com",
  },
  {
    id: "opp2",
    title: "Data Learnership",
    description: "Learn data skills",
    location: "Cape Town",
    stipend: "R4000/month",
    closingDate: "2025-11-30",
    company: "DataCo",
    companyUrl: null,
  },
];

describe("OpportunityList", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { onAuthStateChanged } = require("firebase/auth");
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return () => {};
    });

    const { getDocs, collection, query, where } = require("firebase/firestore");
    collection.mockReturnValue({});
    query.mockReturnValue({});
    where.mockReturnValue({});
    getDocs.mockResolvedValue({
      docs: mockOpportunities.map((opp) => ({
        id: opp.id,
        data: () => opp,
      })),
    });
  });

  test("renders page header", async () => {
    render(<OpportunityList />);

    await waitFor(() => {
      expect(screen.getByText(/available opportunities/i)).toBeInTheDocument();
    });

    // Use getAllByText since "Opportunities" appears in both the eyebrow and title
    expect(screen.getAllByText(/opportunities/i).length).toBeGreaterThan(0);
  });

  test("renders list of opportunities from Firestore", async () => {
    render(<OpportunityList />);

    await waitFor(() => {
      expect(screen.getByText(/software internship/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/data learnership/i)).toBeInTheDocument();
  });

  test("renders opportunity details", async () => {
    render(<OpportunityList />);

    await waitFor(() => {
      expect(screen.getByText(/software internship/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/a great internship opportunity/i)).toBeInTheDocument();
    expect(screen.getByText(/johannesburg/i)).toBeInTheDocument();
    expect(screen.getByText(/r5000\/month/i)).toBeInTheDocument();
  });

  test("renders Apply Now buttons for each opportunity", async () => {
    render(<OpportunityList />);

    await waitFor(() => {
      expect(screen.getAllByText(/apply now/i)).toHaveLength(2);
    });
  });

  test("shows alert when unauthenticated user clicks Apply Now", async () => {
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<OpportunityList />);

    await waitFor(() => {
      expect(screen.getAllByText(/apply now/i)[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText(/apply now/i)[0]);
    expect(alertMock).toHaveBeenCalledWith("Please log in first");

    alertMock.mockRestore();
  });

  test("renders More Info link when companyUrl exists", async () => {
    render(<OpportunityList />);

    await waitFor(() => {
      expect(screen.getByText(/more about techcorp/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/more about techcorp/i).closest("a")
    ).toHaveAttribute("href", "https://techcorp.com");
  });

  test("does not render More Info link when companyUrl is null", async () => {
    render(<OpportunityList />);

    await waitFor(() => {
      expect(screen.getByText(/data learnership/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/more about dataco/i)).not.toBeInTheDocument();
  });

  test("submits application for authenticated user", async () => {
    const { onAuthStateChanged } = require("firebase/auth");
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: "user123" });
      return () => {};
    });

    const { addDoc, collection, getDocs, query, where } = require("firebase/firestore");
    collection.mockReturnValue({});
    query.mockReturnValue({});
    where.mockReturnValue({});
    // First call returns opportunities, second returns user's existing applications
    getDocs
      .mockResolvedValueOnce({
        docs: mockOpportunities.map((opp) => ({ id: opp.id, data: () => opp })),
      })
      .mockResolvedValueOnce({ docs: [] });

    addDoc.mockResolvedValue({ id: "newApp1" });

    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
    const onApplicationAdded = jest.fn();

    render(<OpportunityList onApplicationAdded={onApplicationAdded} />);

    await waitFor(() => {
      expect(screen.getAllByText(/apply now/i)[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText(/apply now/i)[0]);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Application submitted!");
    });

    expect(onApplicationAdded).toHaveBeenCalled();
    alertMock.mockRestore();
  });
});
