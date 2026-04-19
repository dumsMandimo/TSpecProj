import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import Dashboard from "./Dashboard";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children }) => children,
}));

jest.mock("../../firebase", () => ({
  db: {},
  auth: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  getFirestore: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));

jest.mock("./MyApplications", () => ({
  __esModule: true,
  default: ({ name, applications }) => (
    <div data-testid="my-applications">
      <span>Hello {name}</span>
      <span>Apps: {applications.length}</span>
    </div>
  ),
}));

jest.mock("./OpportunityList", () => ({
  __esModule: true,
  default: () => <div data-testid="opportunity-list">Opportunities</div>,
}));

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { getDocs, collection } = require("firebase/firestore");
    collection.mockReturnValue({});
    getDocs.mockResolvedValue({ docs: [] });
  });

  test("renders dashboard page", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByTestId("my-applications")).toBeInTheDocument();
    });
  });

  test("renders MyApplications child component", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/hello peace/i)).toBeInTheDocument();
    });
  });

  test("renders OpportunityList child component", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByTestId("opportunity-list")).toBeInTheDocument();
    });
  });

  test("renders My Profile button", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/my profile/i)).toBeInTheDocument();
    });
  });

  test("navigates to profile on button click", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/my profile/i)).toBeInTheDocument();
    });

    screen.getByText(/my profile/i).click();
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/myProfile");
  });

  test("fetches applications from Firestore on mount", async () => {
    const { getDocs } = require("firebase/firestore");

    const mockApps = [
      { id: "app1", data: () => ({ title: "Internship", status: "Submitted" }) },
      { id: "app2", data: () => ({ title: "Learnership", status: "Received" }) },
    ];

    getDocs.mockResolvedValue({ docs: mockApps });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/apps: 2/i)).toBeInTheDocument();
    });
  });
});
