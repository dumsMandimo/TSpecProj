import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProtectedRoute from "./ProtectedRoute";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

jest.mock("../services/firebase", () => ({
  auth: {},
  db: {},
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  Navigate: ({ to, replace }) => (
    <div
      data-testid="navigate"
      data-to={to}
      data-replace={replace ? "true" : "false"}
    >
      Redirecting to {to}
    </div>
  ),
}));

describe("ProtectedRoute", () => {
  let unsubscribeMock;

  beforeEach(() => {
    jest.clearAllMocks();

    unsubscribeMock = jest.fn();

    doc.mockReturnValue("mock-user-ref");
  });

  function mockAuthState(user) {
    onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(user);
      return unsubscribeMock;
    });
  }

  function mockFirestoreRole(role) {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role }),
    });
  }

  function mockFirestoreNoDocument() {
    getDoc.mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    });
  }

  test("shows loading while authentication state is being checked", () => {
    onAuthStateChanged.mockImplementation(() => unsubscribeMock);

    render(
      <ProtectedRoute allowedRoles={["provider"]}>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("redirects to login when user is not logged in", async () => {
    mockAuthState(null);

    render(
      <ProtectedRoute allowedRoles={["provider"]}>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("navigate")).toBeInTheDocument();
    });

    expect(screen.getByTestId("navigate")).toHaveAttribute("data-to", "/login");
    expect(screen.getByTestId("navigate")).toHaveAttribute(
      "data-replace",
      "true",
    );
    expect(getDoc).not.toHaveBeenCalled();
  });

  test("redirects to login when no Firestore user document exists", async () => {
    mockAuthState({ uid: "user123" });
    mockFirestoreNoDocument();

    render(
      <ProtectedRoute allowedRoles={["provider"]}>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("navigate")).toBeInTheDocument();
    });

    expect(doc).toHaveBeenCalledWith({}, "users", "user123");
    expect(getDoc).toHaveBeenCalledWith("mock-user-ref");
    expect(screen.getByTestId("navigate")).toHaveAttribute("data-to", "/login");
  });

  test("redirects to login when Firestore document exists but role is missing", async () => {
    mockAuthState({ uid: "user123" });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({}),
    });

    render(
      <ProtectedRoute allowedRoles={["provider"]}>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("navigate")).toBeInTheDocument();
    });

    expect(screen.getByTestId("navigate")).toHaveAttribute("data-to", "/login");
  });

  test("renders children when user has an allowed role", async () => {
    mockAuthState({ uid: "user123" });
    mockFirestoreRole("provider");

    render(
      <ProtectedRoute allowedRoles={["provider"]}>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });

  test("redirects to login when user role is not allowed", async () => {
    mockAuthState({ uid: "user123" });
    mockFirestoreRole("student");

    render(
      <ProtectedRoute allowedRoles={["provider"]}>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("navigate")).toBeInTheDocument();
    });

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.getByTestId("navigate")).toHaveAttribute("data-to", "/login");
  });

  test("renders children when allowedRoles is empty and user has any role", async () => {
    mockAuthState({ uid: "user123" });
    mockFirestoreRole("admin");

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });

  test("redirects to login when fetching role fails", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockAuthState({ uid: "user123" });
    getDoc.mockRejectedValue(new Error("Firestore failed"));

    render(
      <ProtectedRoute allowedRoles={["provider"]}>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("navigate")).toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(screen.getByTestId("navigate")).toHaveAttribute("data-to", "/login");

    consoleErrorSpy.mockRestore();
  });

  test("unsubscribes from auth listener on unmount", () => {
    mockAuthState(null);

    const { unmount } = render(
      <ProtectedRoute allowedRoles={["provider"]}>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
