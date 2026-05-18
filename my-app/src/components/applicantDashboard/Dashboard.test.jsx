import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Dashboard from "./Dashboard";

const mockNavigate = jest.fn();
const mockSignOut = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children }) => children,
}));

jest.mock("../../firebase", () => ({
  db: {},
  auth: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({ uid: "user1", displayName: "Peace" });
    return jest.fn();
  }),
  signOut: (...args) => mockSignOut(...args),
}));

jest.mock("../../services/userService", () => ({
  subscribeToOpportunities: jest.fn((onData) => {
    onData([]);
    return jest.fn();
  }),
  subscribeToMyApplications: jest.fn((onData) => {
    onData([]);
    return jest.fn();
  }),
}));

jest.mock("./MyApplications", () => ({
  __esModule: true,
  default: ({ applications }) => (
    <div data-testid="my-applications">Apps: {applications.length}</div>
  ),
}));

jest.mock("./OpportunityList", () => ({
  __esModule: true,
  default: () => <div data-testid="opportunity-list">Opportunities</div>,
}));

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue(undefined);
    const { getDoc } = require("firebase/firestore");
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: "Peace" }),
    });
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
      expect(screen.getByTestId("my-applications")).toBeInTheDocument();
    });
  });

  test("renders OpportunityList child component", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByTestId("opportunity-list")).toBeInTheDocument();
    });
  });

  test("renders Logout button", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
    });
  });

  test("logs out and navigates to login on button click", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("shows welcome message with user name", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
      expect(screen.getByText("Peace")).toBeInTheDocument();
    });
  });
});
