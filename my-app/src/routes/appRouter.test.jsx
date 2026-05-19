import { render, screen } from "@testing-library/react";
import AppRouter from "./appRouter";

// Mock all page components so tests are isolated
jest.mock("../pages/signupPage", () => () => <div>Signup Page</div>);

jest.mock("../pages/loginPage", () => () => <div>Login Page</div>);

jest.mock("../pages/admin/adminLayout", () => ({
  __esModule: true,
  default: () => {
    const { Outlet } = require("react-router-dom");

    return (
      <div>
        Admin Layout
        <Outlet />
      </div>
    );
  },
}));

jest.mock("../pages/admin/adminDashboard", () => () => (
  <div>Admin Dashboard</div>
));

jest.mock("../pages/admin/Opportunities", () => () => (
  <div>Opportunities Page</div>
));

jest.mock("../pages/admin/Users", () => () => (
  <div>Users Page</div>
));

jest.mock("../components/applicantDashboard/Dashboard", () => () => (
  <div>Applicant Dashboard</div>
));

jest.mock("../pages/ProviderDashboard/ProviderDashboard", () => () => (
  <div>Provider Dashboard</div>
));

// FIXED FOR HASHROUTER
function renderAtPath(path) {
  window.location.hash = `#${path}`;
  return render(<AppRouter />);
}

describe("AppRouter", () => {

  // ─── Public routes ────────────────────────────────────────

  test("renders signup page at /signup", () => {
    renderAtPath("/signup");

    expect(screen.getByText("Signup Page")).toBeInTheDocument();
  });

  test("renders login page at /login", () => {
    renderAtPath("/login");

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  // ─── Root and catch-all redirects ─────────────────────────

  test("redirects from / to /signup", () => {
    renderAtPath("/");

    expect(screen.getByText("Signup Page")).toBeInTheDocument();
  });

  test("redirects unknown routes to /signup", () => {
    renderAtPath("/some/unknown/route");

    expect(screen.getByText("Signup Page")).toBeInTheDocument();
  });

  test("redirects from completely unknown path to signup", () => {
    renderAtPath("/this-does-not-exist");

    expect(screen.getByText("Signup Page")).toBeInTheDocument();
  });

  // ─── Admin routes ─────────────────────────────────────────

  test("renders admin layout and dashboard at /dashboard/admin", () => {
    renderAtPath("/dashboard/admin");

    expect(screen.getByText("Admin Layout")).toBeInTheDocument();

    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
  });

  test("renders opportunities page at /dashboard/admin/opportunities", () => {
    renderAtPath("/dashboard/admin/opportunities");

    expect(screen.getByText("Admin Layout")).toBeInTheDocument();

    expect(screen.getByText("Opportunities Page")).toBeInTheDocument();
  });

  test("renders users page at /dashboard/admin/users", () => {
    renderAtPath("/dashboard/admin/users");

    expect(screen.getByText("Admin Layout")).toBeInTheDocument();

    expect(screen.getByText("Users Page")).toBeInTheDocument();
  });

  test("does not render signup page at admin route", () => {
    renderAtPath("/dashboard/admin");

    expect(screen.queryByText("Signup Page")).not.toBeInTheDocument();
  });

  // ─── Applicant routes ─────────────────────────────────────

  test("renders applicant dashboard at /dashboard/applicant", () => {
    renderAtPath("/dashboard/applicant");

    expect(screen.getByText("Applicant Dashboard")).toBeInTheDocument();
  });

  test("does not render signup page at applicant route", () => {
    renderAtPath("/dashboard/applicant");

    expect(screen.queryByText("Signup Page")).not.toBeInTheDocument();
  });

  test("does not render admin layout at applicant route", () => {
    renderAtPath("/dashboard/applicant");

    expect(screen.queryByText("Admin Layout")).not.toBeInTheDocument();
  });

  // ─── Provider routes ──────────────────────────────────────

  test("renders provider dashboard at /dashboard/provider", () => {
    renderAtPath("/dashboard/provider");

    expect(screen.getByText("Provider Dashboard")).toBeInTheDocument();
  });

  test("does not render signup page at provider route", () => {
    renderAtPath("/dashboard/provider");

    expect(screen.queryByText("Signup Page")).not.toBeInTheDocument();
  });

  test("does not render admin layout at provider route", () => {
    renderAtPath("/dashboard/provider");

    expect(screen.queryByText("Admin Layout")).not.toBeInTheDocument();
  });

  // ─── Route isolation ──────────────────────────────────────

  test("signup page does not render at login route", () => {
    renderAtPath("/login");

    expect(screen.queryByText("Signup Page")).not.toBeInTheDocument();
  });

  test("login page does not render at signup route", () => {
    renderAtPath("/signup");

    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  test("applicant dashboard does not render at provider route", () => {
    renderAtPath("/dashboard/provider");

    expect(
      screen.queryByText("Applicant Dashboard")
    ).not.toBeInTheDocument();
  });

  test("provider dashboard does not render at applicant route", () => {
    renderAtPath("/dashboard/applicant");

    expect(
      screen.queryByText("Provider Dashboard")
    ).not.toBeInTheDocument();
  });

  test("opportunities page does not render at users route", () => {
    renderAtPath("/dashboard/admin/users");

    expect(
      screen.queryByText("Opportunities Page")
    ).not.toBeInTheDocument();
  });

  test("users page does not render at opportunities route", () => {
    renderAtPath("/dashboard/admin/opportunities");

    expect(screen.queryByText("Users Page")).not.toBeInTheDocument();
  });

});