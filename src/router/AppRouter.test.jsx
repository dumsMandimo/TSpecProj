import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("react-router-dom", () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
  Navigate: ({ to }) => <div>Redirected to {to}</div>,
}));

jest.mock("../pages/signupPage", () => () => <div>Signup Page</div>);
jest.mock("../pages/loginPage", () => () => <div>Login Page</div>);
jest.mock("../components/applicantDashboard/Dashboard", () => () => <div>Applicant Dashboard</div>);
jest.mock("../pages/adminLayout", () => () => <div>Admin Layout</div>);
jest.mock("../pages/adminDashboard", () => () => <div>Admin Dashboard</div>);
jest.mock("../pages/ProviderDashboard", () => () => <div>Provider Dashboard</div>);
jest.mock("../components/applicantDashboard/ApplicantProfile", () => () => <div>Applicant Profile</div>);
jest.mock("../components/applicantDashboard/CreateProfile", () => () => <div>Create Profile</div>);

jest.mock("../firebase", () => ({
  db: {},
  storage: {},
  auth: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  getFirestore: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));

import AppRouter from "./AppRouter";

describe("AppRouter", () => {
  test("renders without crashing", () => {
    render(<AppRouter />);
  });

  test("renders SignupPage route", () => {
    render(<AppRouter />);
    expect(screen.getByText(/signup page/i)).toBeInTheDocument();
  });

  test("renders LoginPage route", () => {
    render(<AppRouter />);
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  test("renders ApplicantDashboard route", () => {
    render(<AppRouter />);
    expect(screen.getByText(/applicant dashboard/i)).toBeInTheDocument();
  });

  test("renders AdminDashboard route", () => {
    render(<AppRouter />);
    expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
  });

  test("renders ProviderDashboard route", () => {
    render(<AppRouter />);
    expect(screen.getByText(/provider dashboard/i)).toBeInTheDocument();
  });

  test("renders ApplicantProfile route", () => {
    render(<AppRouter />);
    expect(screen.getByText(/applicant profile/i)).toBeInTheDocument();
  });

  test("renders CreateProfile route", () => {
    render(<AppRouter />);
    expect(screen.getByText(/create profile/i)).toBeInTheDocument();
  });

  test("renders redirect to /signup for root route", () => {
    render(<AppRouter />);
    expect(screen.getAllByText(/redirected to \/signup/i).length).toBeGreaterThan(0);
  });
});
