import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();
const mockFrom = jest.fn();

jest.mock("../../firebase", () => ({
  db: { name: "mock-db" },
  auth: { currentUser: null },
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: (...args) => mockFrom(...args),
    },
  })),
}));

jest.mock("./ApplicantProfile.css", () => ({}));

import ApplicantProfile from "./ApplicantProfile";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, updateDoc, doc } from "firebase/firestore";

const mockUser = { uid: "mock-uid-123" };

const mockProfile = {
  name: "Thabo Nkosi",
  phone: "0821234567",
  education: "Matric",
  province: "Gauteng",
  skills: "JavaScript, React",
  interests: "Web development",
  qualification: "NQF 4 — National Certificate",
  cvUrl: "https://mock-supabase.co/cvs/thabo_cv.pdf",
};

let mockUnsubscribe;

function snap(data, exists = true) {
  return {
    exists: () => exists,
    data: () => data,
  };
}

function setupAuthWithDocs({
  applicantData = mockProfile,
  userData = { province: mockProfile.province },
  applicantExists = true,
  userExists = true,
  user = mockUser,
} = {}) {
  onAuthStateChanged.mockImplementation((_auth, callback) => {
    callback(user);
    return mockUnsubscribe;
  });

  getDoc
    .mockResolvedValueOnce(snap(applicantData, applicantExists))
    .mockResolvedValueOnce(snap(userData, userExists));
}

async function renderLoaded() {
  render(<ApplicantProfile />);
  await screen.findByRole("heading", { name: /my profile/i });
}

async function enterEditMode() {
  fireEvent.click(
    await screen.findByRole("button", { name: /update profile/i }),
  );
  expect(await screen.findByText("Edit Profile")).toBeInTheDocument();
}

describe("ApplicantProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUnsubscribe = jest.fn();

    doc.mockImplementation((_db, collection, uid) => ({
      collection,
      uid,
    }));

    mockFrom.mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    });

    mockUpload.mockResolvedValue({
      data: {},
      error: null,
    });

    mockGetPublicUrl.mockReturnValue({
      data: {
        publicUrl: "https://mock-supabase.co/cvs/uploaded.pdf",
      },
    });

    getDoc.mockReset();
    updateDoc.mockResolvedValue({});

    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(window, "alert").mockImplementation(() => {});

    const { auth } = require("../../firebase");
    auth.currentUser = mockUser;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("shows loading state before profile loads", () => {
    onAuthStateChanged.mockImplementation(() => mockUnsubscribe);

    render(<ApplicantProfile />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("logs error and stays loading when no user is authenticated", async () => {
    onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return mockUnsubscribe;
    });

    render(<ApplicantProfile />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("No user logged in");
    });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("subscribes to auth changes and unsubscribes on unmount", async () => {
    setupAuthWithDocs();

    const { unmount } = render(<ApplicantProfile />);

    await screen.findByRole("heading", { name: /my profile/i });

    unmount();

    expect(onAuthStateChanged).toHaveBeenCalled();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  test("renders profile details after loading", async () => {
    setupAuthWithDocs();

    await renderLoaded();

    expect(screen.getByText("Profile Details")).toBeInTheDocument();
    expect(screen.getByText(/thabo nkosi/i)).toBeInTheDocument();
    expect(screen.getByText(/0821234567/i)).toBeInTheDocument();
    expect(screen.getByText(/matric/i)).toBeInTheDocument();
    expect(screen.getByText(/gauteng/i)).toBeInTheDocument();
    expect(screen.getByText(/javascript, react/i)).toBeInTheDocument();
    expect(screen.getByText(/web development/i)).toBeInTheDocument();
    expect(screen.getByText(/nqf 4/i)).toBeInTheDocument();
  });

  test("uses users province over applicants province when both exist", async () => {
    setupAuthWithDocs({
      applicantData: { ...mockProfile, province: "Gauteng" },
      userData: { province: "Western Cape" },
    });

    await renderLoaded();

    expect(screen.getByText(/western cape/i)).toBeInTheDocument();
  });

  test("falls back to applicant province when user province is missing", async () => {
    setupAuthWithDocs({
      applicantData: { ...mockProfile, province: "Limpopo" },
      userData: {},
    });

    await renderLoaded();

    expect(screen.getByText(/limpopo/i)).toBeInTheDocument();
  });

  test("renders dash fallbacks when profile fields are missing", async () => {
    setupAuthWithDocs({
      applicantData: {},
      userData: {},
      applicantExists: false,
      userExists: false,
    });

    await renderLoaded();

    const details = screen.getByText("Profile Details").closest("fieldset");

    expect(details).toHaveTextContent("Name: —");
    expect(details).toHaveTextContent("Phone: —");
    expect(details).toHaveTextContent("Education: —");
    expect(details).toHaveTextContent("Province: —");
    expect(details).toHaveTextContent("Skills: —");
    expect(details).toHaveTextContent("Interests: —");
    expect(details).toHaveTextContent("NQF Level: —");
  });

  test("renders CV download link when cvUrl exists", async () => {
    setupAuthWithDocs();

    await renderLoaded();

    const link = screen.getByRole("link", { name: /download cv/i });

    expect(link).toHaveAttribute("href", mockProfile.cvUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("does not render CV download link when cvUrl is missing", async () => {
    setupAuthWithDocs({
      applicantData: { ...mockProfile, cvUrl: "" },
    });

    await renderLoaded();

    expect(
      screen.queryByRole("link", { name: /download cv/i }),
    ).not.toBeInTheDocument();
  });

  test("switches to edit mode", async () => {
    setupAuthWithDocs();

    await renderLoaded();
    await enterEditMode();

    expect(screen.getByDisplayValue("Thabo Nkosi")).toBeInTheDocument();
    expect(screen.getByDisplayValue("0821234567")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Matric")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Gauteng")).toBeInTheDocument();
    expect(screen.getByDisplayValue("JavaScript, React")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Web development")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();

    expect(screen.getByLabelText(/update cv/i)).toHaveAttribute(
      "accept",
      ".pdf",
    );
  });

  test("renders all province options in edit mode", async () => {
    setupAuthWithDocs();

    await renderLoaded();
    await enterEditMode();

    [
      "Eastern Cape",
      "Free State",
      "Gauteng",
      "KwaZulu-Natal",
      "Limpopo",
      "Mpumalanga",
      "Northern Cape",
      "North West",
      "Western Cape",
    ].forEach((province) => {
      expect(
        screen.getByRole("option", { name: province }),
      ).toBeInTheDocument();
    });
  });

  test("allows user to edit all fields", async () => {
    setupAuthWithDocs();

    await renderLoaded();
    await enterEditMode();

    fireEvent.change(screen.getByDisplayValue("Thabo Nkosi"), {
      target: { value: "Updated Name" },
    });

    fireEvent.change(screen.getByDisplayValue("0821234567"), {
      target: { value: "0839876543" },
    });

    fireEvent.change(screen.getByDisplayValue("Matric"), {
      target: { value: "Diploma" },
    });

    fireEvent.change(screen.getByDisplayValue("JavaScript, React"), {
      target: { value: "Python, SQL" },
    });

    fireEvent.change(screen.getByDisplayValue("Web development"), {
      target: { value: "Data science" },
    });

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Western Cape" },
    });

    expect(screen.getByDisplayValue("Updated Name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("0839876543")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Diploma")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Python, SQL")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Data science")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Western Cape")).toBeInTheDocument();
  });

  test("cancel exits edit mode without saving", async () => {
    setupAuthWithDocs();

    await renderLoaded();
    await enterEditMode();

    fireEvent.change(screen.getByDisplayValue("Thabo Nkosi"), {
      target: { value: "Should Not Save" },
    });

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByText("Profile Details")).toBeInTheDocument();
    expect(updateDoc).not.toHaveBeenCalled();
  });

  test("saving updates applicant and user documents", async () => {
    setupAuthWithDocs();

    await renderLoaded();
    await enterEditMode();

    fireEvent.change(screen.getByDisplayValue("Thabo Nkosi"), {
      target: { value: "Updated Name" },
    });

    fireEvent.change(screen.getByDisplayValue("0821234567"), {
      target: { value: "0839876543" },
    });

    fireEvent.change(screen.getByDisplayValue("Matric"), {
      target: { value: "Diploma" },
    });

    fireEvent.change(screen.getByDisplayValue("JavaScript, React"), {
      target: { value: "Python, SQL" },
    });

    fireEvent.change(screen.getByDisplayValue("Web development"), {
      target: { value: "Data science" },
    });

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Western Cape" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledTimes(2);
    });

    expect(updateDoc).toHaveBeenNthCalledWith(
      1,
      { collection: "applicants", uid: "mock-uid-123" },
      {
        name: "Updated Name",
        phone: "0839876543",
        education: "Diploma",
        skills: "Python, SQL",
        interests: "Data science",
        cvUrl: mockProfile.cvUrl,
      },
    );

    expect(updateDoc).toHaveBeenNthCalledWith(
      2,
      { collection: "users", uid: "mock-uid-123" },
      {
        province: "Western Cape",
      },
    );

    expect(window.alert).toHaveBeenCalledWith("Profile updated!");
    expect(screen.getByText("Profile Details")).toBeInTheDocument();
  });

  test("saving with a new CV uploads to Supabase and stores new cvUrl", async () => {
    setupAuthWithDocs();

    jest.spyOn(Date, "now").mockReturnValue(1710000000000);

    await renderLoaded();
    await enterEditMode();

    const file = new File(["fake pdf content"], "cv.pdf", {
      type: "application/pdf",
    });

    const fileInput = screen.getByLabelText(/update cv/i);

    Object.defineProperty(fileInput, "files", {
      value: [file],
      configurable: true,
    });

    fireEvent.change(fileInput);

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(
        "mock-uid-123_1710000000000.pdf",
        file,
        {
          contentType: "application/pdf",
          upsert: true,
        },
      );
    });

    expect(mockFrom).toHaveBeenCalledWith("cvs");

    expect(mockGetPublicUrl).toHaveBeenCalledWith(
      "mock-uid-123_1710000000000.pdf",
    );

    await waitFor(() => {
      expect(updateDoc).toHaveBeenNthCalledWith(
        1,
        { collection: "applicants", uid: "mock-uid-123" },
        expect.objectContaining({
          cvUrl: "https://mock-supabase.co/cvs/uploaded.pdf",
        }),
      );
    });
  });

  test("saving without currentUser logs error and does not update", async () => {
    setupAuthWithDocs();

    const { auth } = require("../../firebase");
    auth.currentUser = null;

    await renderLoaded();
    await enterEditMode();

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("No user logged in");
    });

    expect(updateDoc).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
    expect(screen.getByText("Edit Profile")).toBeInTheDocument();
  });

  test("shows failure alert when applicant update fails", async () => {
    setupAuthWithDocs();

    updateDoc.mockRejectedValueOnce(new Error("Applicant update failed"));

    await renderLoaded();
    await enterEditMode();

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Failed to update profile. Please try again.",
      );
    });

    expect(console.error).toHaveBeenCalledWith(
      "Error updating profile:",
      expect.any(Error),
    );
  });

  test("shows failure alert when user province update fails", async () => {
    setupAuthWithDocs();

    updateDoc
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("User update failed"));

    await renderLoaded();
    await enterEditMode();

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Failed to update profile. Please try again.",
      );
    });

    expect(updateDoc).toHaveBeenCalledTimes(2);
  });

  test("shows failure alert when CV upload fails", async () => {
    setupAuthWithDocs();

    mockUpload.mockResolvedValueOnce({
      data: null,
      error: { message: "Upload failed" },
    });

    await renderLoaded();
    await enterEditMode();

    const file = new File(["fake pdf content"], "cv.pdf", {
      type: "application/pdf",
    });

    const fileInput = screen.getByLabelText(/update cv/i);

    Object.defineProperty(fileInput, "files", {
      value: [file],
      configurable: true,
    });

    fireEvent.change(fileInput);

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Failed to update profile. Please try again.",
      );
    });

    expect(updateDoc).not.toHaveBeenCalled();
  });
});
