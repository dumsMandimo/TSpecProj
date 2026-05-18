import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Sidebar from "./adminSidebar";

import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";

const mockNavigate = jest.fn();
let mockPathname = "/dashboard/admin";

jest.mock("../../services/firebase", () => ({
  auth: { currentUser: { uid: "admin123" } },
}));

jest.mock("firebase/auth", () => ({
  signOut: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, style }) => (
    <a href={to} style={style}>
      {children}
    </a>
  ),
  useLocation: () => ({
    pathname: mockPathname,
  }),
  useNavigate: () => mockNavigate,
}));

describe("adminSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/dashboard/admin";
    signOut.mockResolvedValue();
  });

  test("renders the admin title", () => {
    render(<Sidebar />);

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  test("renders the admin navigation", () => {
    render(<Sidebar />);

    expect(
      screen.getByRole("navigation", { name: /admin navigation/i }),
    ).toBeInTheDocument();
  });

  test("renders dashboard, opportunities, and users links", () => {
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard/admin",
    );

    expect(
      screen.getByRole("link", { name: /opportunities/i }),
    ).toHaveAttribute("href", "/dashboard/admin/opportunities");

    expect(screen.getByRole("link", { name: /users/i })).toHaveAttribute(
      "href",
      "/dashboard/admin/users",
    );
  });

  test("marks Dashboard as active when on admin dashboard route", () => {
    mockPathname = "/dashboard/admin";

    render(<Sidebar />);

    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveStyle({
      background: "#ff7b00",
    });
  });

  test("marks Opportunities as active when on opportunities route", () => {
    mockPathname = "/dashboard/admin/opportunities";

    render(<Sidebar />);

    expect(screen.getByRole("link", { name: /opportunities/i })).toHaveStyle({
      background: "#ff7b00",
    });

    expect(screen.getByRole("link", { name: /dashboard/i })).not.toHaveStyle({
      background: "#ff7b00",
    });
  });

  test("marks Users as active when on users route", () => {
    mockPathname = "/dashboard/admin/users";

    render(<Sidebar />);

    expect(screen.getByRole("link", { name: /users/i })).toHaveStyle({
      background: "#ff7b00",
    });

    expect(screen.getByRole("link", { name: /dashboard/i })).not.toHaveStyle({
      background: "#ff7b00",
    });
  });

  test("renders logout button", () => {
    render(<Sidebar />);

    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  test("calls signOut and navigates to login when logout is clicked", async () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith(auth);
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });
});
