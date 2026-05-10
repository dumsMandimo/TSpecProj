import {
  signUpWithEmail,
  loginWithEmail,
  resendVerificationEmail,
  signUpWithGoogle,
} from "./authService";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth } from "./firebase";

// 🔥 MOCK FIREBASE
jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock("./firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

describe("Auth Service Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * =========================
   * SIGNUP WITH EMAIL
   * =========================
   */
  test("signUpWithEmail creates user successfully", async () => {
    const mockUser = { uid: "123", email: "test@test.com" };

    createUserWithEmailAndPassword.mockResolvedValue({
      user: mockUser,
    });

    const result = await signUpWithEmail(
      "test@test.com",
      "123456",
      "applicant",
      { displayName: "Test User" }
    );

    expect(createUserWithEmailAndPassword).toHaveBeenCalled();
    expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
    expect(updateProfile).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  test("signUpWithEmail throws error for invalid email", async () => {
    await expect(
      signUpWithEmail("bademail", "123456", "applicant")
    ).rejects.toThrow("Please enter a valid email address");
  });

  test("signUpWithEmail throws error for weak password", async () => {
    await expect(
      signUpWithEmail("test@test.com", "123", "applicant")
    ).rejects.toThrow("Password must be at least 6 characters");
  });

  /**
   * =========================
   * LOGIN WITH EMAIL
   * =========================
   */
  test("loginWithEmail logs in and returns role", async () => {
    const mockUser = {
      uid: "123",
      reload: jest.fn(),
    };

    signInWithEmailAndPassword.mockResolvedValue({
      user: mockUser,
    });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: "admin" }),
    });

    const result = await loginWithEmail("test@test.com", "123456");

    expect(signInWithEmailAndPassword).toHaveBeenCalled();
    expect(mockUser.reload).toHaveBeenCalled();
    expect(result.role).toBe("admin");
  });

  /**
   * =========================
   * RESEND VERIFICATION
   * =========================
   */
  test("resendVerificationEmail sends email", async () => {
    const mockUser = { uid: "123" };
    auth.currentUser = mockUser;

    await resendVerificationEmail();

    expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
  });

  test("resendVerificationEmail throws if no user", async () => {
    auth.currentUser = null;

    await expect(resendVerificationEmail()).rejects.toThrow(
      "No logged-in user found"
    );
  });

  /**
   * =========================
   * GOOGLE SIGNUP
   * =========================
   */
  test("signUpWithGoogle creates new user in DB if not exists", async () => {
    const mockUser = { uid: "123", email: "google@test.com" };

    signInWithPopup.mockResolvedValue({ user: mockUser });

    getDoc.mockResolvedValue({
      exists: () => false,
    });

    const result = await signUpWithGoogle("applicant");

    expect(signInWithPopup).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  test("signUpWithGoogle does not create user if already exists", async () => {
    const mockUser = { uid: "123", email: "google@test.com" };

    signInWithPopup.mockResolvedValue({ user: mockUser });

    getDoc.mockResolvedValue({
      exists: () => true,
    });

    await signUpWithGoogle("applicant");

    expect(setDoc).not.toHaveBeenCalled();
  });
});