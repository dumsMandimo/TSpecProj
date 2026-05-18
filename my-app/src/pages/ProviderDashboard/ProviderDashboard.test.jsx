import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ProviderDashboard from "./ProviderDashboard";
import { auth } from "../../services/firebase";
import { getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

// mocks
const mockNavigate = jest.fn();
const mockSetTab = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("firebase/auth", () => ({
  signOut: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock("../../services/firebase", () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

// mock child components (important to isolate tests)
jest.mock("./components/Sidebar", () => (props) => (
  <div>
    <button onClick={() => props.setTab("listings")}>Sidebar</button>
  </div>
));

jest.mock("./components/Navbar", () => ({ onLogout }) => (
  <button onClick={onLogout}>Logout</button>
));

jest.mock("./components/OverviewCards", () => () => (
  <div>OverviewCards</div>
));

jest.mock("./components/ListingsPanel", () => () => (
  <div>ListingsPanel</div>
));

jest.mock("./components/ApplicationsPanel", () => () => (
  <div>ApplicationsPanel</div>
));

jest.mock("./components/CreateOpportunityForm", () => () => (
  <div>CreateOpportunityForm</div>
));

describe("ProviderDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("redirects to login if no user", async () => {
    auth.currentUser = null;

    render(<ProviderDashboard />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("redirects to login if user doc does not exist", async () => {
    auth.currentUser = { uid: "123" };

    getDoc.mockResolvedValueOnce({ exists: () => false });

    render(<ProviderDashboard />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("redirects if role is not provider", async () => {
    auth.currentUser = { uid: "123", displayName: "Test" };

    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: "applicant", status: "active" }),
    });

    render(<ProviderDashboard />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("redirects to pending approval if status is pending", async () => {
    auth.currentUser = { uid: "123", email: "test@test.com" };

    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: "provider", status: "pending" }),
    });

    render(<ProviderDashboard />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/pending-approval");
    });
  });

  test("renders dashboard when provider is approved", async () => {
    auth.currentUser = {
      uid: "123",
      email: "provider@test.com",
      displayName: "Provider Name",
    };

    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: "provider", status: "active" }),
    });

    render(<ProviderDashboard />);

    await waitFor(() => {
      expect(screen.getByText("OverviewCards")).toBeInTheDocument();
    });
  });

  test("switches tabs when sidebar triggers setTab", async () => {
    auth.currentUser = {
      uid: "123",
      email: "provider@test.com",
    };

    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: "provider", status: "active" }),
    });

    render(<ProviderDashboard />);

    await waitFor(() => {
      expect(screen.getByText("OverviewCards")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Sidebar"));

    await waitFor(() => {
      expect(screen.getByText("ListingsPanel")).toBeInTheDocument();
    });
  });

  test("logout calls signOut and navigates to login", async () => {
    auth.currentUser = {
      uid: "123",
      email: "provider@test.com",
    };

    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: "provider", status: "active" }),
    });

    signOut.mockResolvedValueOnce();

    render(<ProviderDashboard />);

    await waitFor(() => {
      expect(screen.getByText("OverviewCards")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Logout"));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });
});