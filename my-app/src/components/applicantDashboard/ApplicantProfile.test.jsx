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

jest.mock("../nqfSelect", () => ({
  OTHER_QUALIFICATION_VALUE: "OTHER",

  NqfDropdown: ({ value, onChange }) => (
    <select
      data-testid="nqf-dropdown"
      value={value}
      onChange={onChange}
    >
      <option value="">Select NQF</option>
      <option value="NQF 4">NQF 4</option>
    </select>
  ),

  SectorDropdown: ({ value, onChange }) => (
    <select
      data-testid="sector-dropdown"
      value={value}
      onChange={onChange}
    >
      <option value="">Select Sector</option>
      <option value="IT">IT</option>
    </select>
  ),

  SaqaQualificationDropdown: ({ value, onChange }) => (
    <select
      data-testid="saqa-dropdown"
      value={value}
      onChange={(e) =>
        onChange({
          target: {
            value: e.target.value,
            dataset: {
              title:
                e.target.value === "OTHER"
                  ? ""
                  : "National Certificate",
              isOther: e.target.value === "OTHER" ? "true" : "false",
              sourceUrl: "https://saqa.org.za/test",
              learningSubfield: "Information Technology",
            },
          },
        })
      }
    >
      <option value="">Select Qualification</option>
      <option value="QUAL123">Qualification</option>
      <option value="OTHER">Other</option>
    </select>
  ),
}));

jest.mock("./ApplicantProfile.css", () => ({}));

import ApplicantProfile from "./ApplicantProfile";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, updateDoc, doc } from "firebase/firestore";
import { OTHER_QUALIFICATION_VALUE } from "../nqfSelect";

const mockUser = { uid: "mock-uid-123" };

const mockProfile = {
  name: "Thabo Nkosi",
  phone: "0821234567",
  education: "Matric",
  province: "Gauteng",
  skills: ["JavaScript", "React"],
  interests: "Web development",
  qualification: "NQF 4",
  sector: "IT",
  saqaQualificationId: "QUAL123",
  qualificationTitle: "National Certificate",
  qualificationSource: "SAQA",
  qualificationSourceUrl: "https://saqa.org.za/test",
  saqaLearningArea: "Information Technology",
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
    await screen.findByRole("button", {
      name: /update profile/i,
    }),
  );

  expect(
    await screen.findByText(/edit profile/i),
  ).toBeInTheDocument();
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
        publicUrl:
          "https://mock-supabase.co/cvs/uploaded.pdf",
      },
    });

    updateDoc.mockResolvedValue({});

    jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    jest
      .spyOn(window, "alert")
      .mockImplementation(() => {});

    const { auth } = require("../../firebase");
    auth.currentUser = mockUser;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("shows loading state before profile loads", () => {
    onAuthStateChanged.mockImplementation(
      () => mockUnsubscribe,
    );

    render(<ApplicantProfile />);

    expect(
      screen.getByText(/loading/i),
    ).toBeInTheDocument();
  });

  test("renders profile details", async () => {
    setupAuthWithDocs();

    await renderLoaded();

    expect(
      screen.getByText(/thabo nkosi/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/0821234567/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/matric/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/web development/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/information technology/i),
    ).toBeInTheDocument();
  });

  test("renders CV link", async () => {
    setupAuthWithDocs();

    await renderLoaded();

    const link = screen.getByRole("link", {
      name: /download cv/i,
    });

    expect(link).toHaveAttribute(
      "href",
      mockProfile.cvUrl,
    );
  });

  test("switches to edit mode", async () => {
    setupAuthWithDocs();

    await renderLoaded();
    await enterEditMode();

    expect(
      screen.getByDisplayValue("Thabo Nkosi"),
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("0821234567"),
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("Matric"),
    ).toBeInTheDocument();
  });

  test("adds a skill", async () => {
    setupAuthWithDocs({
      applicantData: {
        ...mockProfile,
        skills: [],
      },
    });

    await renderLoaded();
    await enterEditMode();

    const input = screen.getByPlaceholderText(
      /excel, java, bookkeeping/i,
    );

    fireEvent.change(input, {
      target: { value: "Python" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /add/i }),
    );

    expect(
      screen.getByText("Python"),
    ).toBeInTheDocument();
  });

  test("removes a skill", async () => {
    setupAuthWithDocs();

    await renderLoaded();
    await enterEditMode();

    fireEvent.click(
      screen.getByLabelText(/remove javascript/i),
    );

    expect(
      screen.queryByText("JavaScript"),
    ).not.toBeInTheDocument();
  });

  test("prevents duplicate skills", async () => {
    setupAuthWithDocs();

    await renderLoaded();
    await enterEditMode();

    const input = screen.getByPlaceholderText(
      /excel, java, bookkeeping/i,
    );

    fireEvent.change(input, {
      target: { value: "javascript" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /add/i }),
    );

    const skills = screen.getAllByText(/javascript/i);

    expect(skills.length).toBe(1);
  });

  test("adds skill using Enter key", async () => {
    setupAuthWithDocs({
      applicantData: {
        ...mockProfile,
        skills: [],
      },
    });

    await renderLoaded();
    await enterEditMode();

    const input = screen.getByPlaceholderText(
      /excel, java, bookkeeping/i,
    );

    fireEvent.change(input, {
      target: { value: "NodeJS" },
    });

    fireEvent.keyDown(input, {
      key: "Enter",
      code: "Enter",
    });

    expect(
      screen.getByText("NodeJS"),
    ).toBeInTheDocument();
  });

  test("shows helper text when no skills exist", async () => {
    setupAuthWithDocs({
      applicantData: {
        ...mockProfile,
        skills: [],
      },
    });

    await renderLoaded();
    await enterEditMode();

    expect(
      screen.getByText(
        /no practical skills added yet/i,
      ),
    ).toBeInTheDocument();
  });

  test("renders SAQA source link", async () => {
    setupAuthWithDocs();

    await renderLoaded();

    const link = screen.getByRole("link", {
      name: /view qualification source/i,
    });

    expect(link).toHaveAttribute(
      "href",
      "https://saqa.org.za/test",
    );
  });

  test("alerts when qualification is missing", async () => {
    setupAuthWithDocs({
      applicantData: {
        ...mockProfile,
        qualification: "",
      },
    });

    await renderLoaded();
    await enterEditMode();

    fireEvent.click(
      screen.getByRole("button", {
        name: /save changes/i,
      }),
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Please select an NQF level / qualification type.",
      );
    });
  });

  test("alerts when sector is missing", async () => {
    setupAuthWithDocs({
      applicantData: {
        ...mockProfile,
        sector: "",
      },
    });

    await renderLoaded();
    await enterEditMode();

    fireEvent.click(
      screen.getByRole("button", {
        name: /save changes/i,
      }),
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Please select a career interest sector.",
      );
    });
  });

  test("alerts when qualification selection is missing", async () => {
    setupAuthWithDocs({
      applicantData: {
        ...mockProfile,
        saqaQualificationId: "",
      },
    });

    await renderLoaded();
    await enterEditMode();

    fireEvent.click(
      screen.getByRole("button", {
        name: /save changes/i,
      }),
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Please select a specific qualification or Other / Not listed.",
      );
    });
  });

  test("alerts when custom qualification title is missing", async () => {
    setupAuthWithDocs({
      applicantData: {
        ...mockProfile,
        saqaQualificationId:
          OTHER_QUALIFICATION_VALUE,
        qualificationTitle: "",
        customQualificationTitle: "",
      },
    });

    await renderLoaded();
    await enterEditMode();

    fireEvent.click(
      screen.getByRole("button", {
        name: /save changes/i,
      }),
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Please enter your qualification title.",
      );
    });
  });

  test("updates profile successfully", async () => {
    setupAuthWithDocs();

    await renderLoaded();
    await enterEditMode();

    fireEvent.change(
      screen.getByDisplayValue("Thabo Nkosi"),
      {
        target: { value: "Updated User" },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /save changes/i,
      }),
    );

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledTimes(2);
    });

    expect(updateDoc).toHaveBeenNthCalledWith(
      1,
      {
        collection: "applicants",
        uid: "mock-uid-123",
      },
      expect.objectContaining({
        name: "Updated User",
        normalizedSkills: [
          "javascript",
          "react",
        ],
      }),
    );

    expect(window.alert).toHaveBeenCalledWith(
      "Profile updated!",
    );
  });

  test("uploads CV successfully", async () => {
    setupAuthWithDocs();

    jest
      .spyOn(Date, "now")
      .mockReturnValue(1710000000000);

    await renderLoaded();
    await enterEditMode();

    const file = new File(
      ["fake pdf"],
      "cv.pdf",
      {
        type: "application/pdf",
      },
    );

    const input = screen.getByLabelText(
      /update cv/i,
    );

    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });

    fireEvent.change(input);

    fireEvent.click(
      screen.getByRole("button", {
        name: /save changes/i,
      }),
    );

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
    });

    expect(mockGetPublicUrl).toHaveBeenCalled();

    expect(updateDoc).toHaveBeenCalled();
  });

  test("handles upload failure", async () => {
    setupAuthWithDocs();

    mockUpload.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Upload failed",
      },
    });

    await renderLoaded();
    await enterEditMode();

    const file = new File(
      ["fake pdf"],
      "cv.pdf",
      {
        type: "application/pdf",
      },
    );

    const input = screen.getByLabelText(
      /update cv/i,
    );

    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });

    fireEvent.change(input);

    fireEvent.click(
      screen.getByRole("button", {
        name: /save changes/i,
      }),
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Failed to update profile. Please try again.",
      );
    });
  });

  test("handles update failure", async () => {
    setupAuthWithDocs();

    updateDoc.mockRejectedValueOnce(
      new Error("Failed"),
    );

    await renderLoaded();
    await enterEditMode();

    fireEvent.click(
      screen.getByRole("button", {
        name: /save changes/i,
      }),
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Failed to update profile. Please try again.",
      );
    });
  });

  test("logs error when no current user exists during save", async () => {
    setupAuthWithDocs();

    const { auth } = require("../../firebase");

    auth.currentUser = null;

    await renderLoaded();
    await enterEditMode();

    fireEvent.click(
      screen.getByRole("button", {
        name: /save changes/i,
      }),
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "No user logged in",
      );
    });

    expect(updateDoc).not.toHaveBeenCalled();
  });

  test("cancel exits edit mode", async () => {
    setupAuthWithDocs();

    await renderLoaded();
    await enterEditMode();

    fireEvent.click(
      screen.getByRole("button", {
        name: /cancel/i,
      }),
    );

    expect(
      screen.getByText(/profile details/i),
    ).toBeInTheDocument();
  });
});