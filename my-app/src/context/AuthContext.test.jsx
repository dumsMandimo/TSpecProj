import React from "react";
import { render, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthTests";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc } from "firebase/firestore";

// mocks
jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock("../services/firebase", () => ({
  auth: {},
  db: {},
}));

// helper component to read context
const TestConsumer = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="user">{auth?.user ? "logged-in" : "logged-out"}</div>
      <div data-testid="role">{auth?.role || "no-role"}</div>
      <div data-testid="loading">{auth?.loading ? "loading" : "done"}</div>
    </div>
  );
};

describe("AuthProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("sets user to null when not authenticated", async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn();
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="user"]').textContent).toBe(
        "logged-out"
      );
    });
  });

  test("sets role when user exists", async () => {
    const mockUser = { uid: "123" };

    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: "provider" }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="role"]').textContent).toBe(
        "provider"
      );
    });
  });

  test("handles missing Firestore doc gracefully", async () => {
    const mockUser = { uid: "123" };

    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    getDoc.mockResolvedValueOnce({
      exists: () => false,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="role"]').textContent).toBe(
        "no-role"
      );
    });
  });

  test("handles Firestore error gracefully", async () => {
    const mockUser = { uid: "123" };

    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    getDoc.mockRejectedValueOnce(new Error("Firestore failed"));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="role"]').textContent).toBe(
        "no-role"
      );
    });
  });

  test("updates loading state after auth resolves", async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn();
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="loading"]').textContent).toBe(
        "done"
      );
    });
  });
});