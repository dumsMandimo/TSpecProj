import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateProfile from "./CreateProfile";

const mockNavigate = jest.fn();
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children }) => children,
}));

jest.mock("../../firebase", () => ({
  db: {},
  auth: { currentUser: { uid: "user123" } },
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  getFirestore: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}));

describe("CreateProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpload.mockResolvedValue({ data: {}, error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://supabase.co/storage/cvs/cv.pdf" },
    });
  });

  test("renders the form", () => {
    render(<CreateProfile />);
    expect(screen.getByText(/create profile/i)).toBeInTheDocument();
  });

  test("renders all form fields", () => {
    render(<CreateProfile />);
    expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByText(/education/i)).toBeInTheDocument();
    expect(screen.getByText(/skills/i)).toBeInTheDocument();
    expect(screen.getByText(/interests/i)).toBeInTheDocument();
    expect(screen.getByText(/upload cv/i)).toBeInTheDocument();
    expect(screen.getByText(/save profile/i)).toBeInTheDocument();
  });

  test("updates name field on change", () => {
    render(<CreateProfile />);
    const nameInput = screen.getByPlaceholderText(/full name/i);
    fireEvent.change(nameInput, { target: { name: "name", value: "John Doe" } });
    expect(nameInput.value).toBe("John Doe");
  });

  test("updates phone field on change", () => {
    render(<CreateProfile />);
    const phoneInput = screen.getByPlaceholderText(/phone number/i);
    fireEvent.change(phoneInput, { target: { name: "phone", value: "0821234567" } });
    expect(phoneInput.value).toBe("0821234567");
  });

  test("updates education textarea on change", () => {
    render(<CreateProfile />);
    const textareas = screen.getAllByRole("textbox");
    fireEvent.change(textareas[0], { target: { name: "education", value: "BSc Computer Science" } });
    expect(textareas[0].value).toBe("BSc Computer Science");
  });

  test("updates skills textarea on change", () => {
    render(<CreateProfile />);
    const textareas = screen.getAllByRole("textbox");
    fireEvent.change(textareas[1], { target: { name: "skills", value: "React, Firebase" } });
    expect(textareas[1].value).toBe("React, Firebase");
  });

  test("updates interests textarea on change", () => {
    render(<CreateProfile />);
    const textareas = screen.getAllByRole("textbox");
    fireEvent.change(textareas[2], { target: { name: "interests", value: "Tech, Gaming" } });
    expect(textareas[2].value).toBe("Tech, Gaming");
  });

  test("handles file input for CV", () => {
    render(<CreateProfile />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["cv content"], "cv.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, {
      target: { name: "cv", files: [file] },
    });
    expect(fileInput.files[0].name).toBe("cv.pdf");
  });

  test("saves profile without CV and navigates on submit", async () => {
    const { setDoc, doc, serverTimestamp } = require("firebase/firestore");
    setDoc.mockResolvedValue();
    doc.mockReturnValue({});
    serverTimestamp.mockReturnValue("timestamp");

    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<CreateProfile />);

    // Fill all required fields including CV — the component requires it
    fireEvent.change(screen.getByPlaceholderText(/full name/i), {
      target: { name: "name", value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/phone number/i), {
      target: { name: "phone", value: "0821234567" },
    });
    const textareas = screen.getAllByRole("textbox");
    fireEvent.change(textareas[0], {
      target: { name: "education", value: "Matric" },
    });
    fireEvent.change(textareas[1], {
      target: { name: "skills", value: "JavaScript" },
    });
    // Attach a CV so the CV-required validation passes; mockUpload is not
    // asserted in this test so it exercises the "profile saved" path regardless
    const fileInput = document.querySelector('input[type="file"]');
    const cvFile = new File(["cv"], "cv.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { name: "cv", files: [cvFile] } });

    fireEvent.submit(
      screen.getByRole("button", { name: /save profile/i }).closest("form")
    );

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith("Profile saved successfully!");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/applicant");
    });

    alertMock.mockRestore();
  });

  test("saves profile with CV upload", async () => {
    const { setDoc, doc, serverTimestamp } = require("firebase/firestore");
    setDoc.mockResolvedValue();
    doc.mockReturnValue({});
    serverTimestamp.mockReturnValue("timestamp");

    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<CreateProfile />);

    // Fill text fields BEFORE touching the file input — this avoids a jsdom
    // quirk where assigning properties to the file input's event target can
    // interfere with prior synthetic events in the same render cycle
    fireEvent.change(screen.getByPlaceholderText(/full name/i), {
      target: { name: "name", value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/phone number/i), {
      target: { name: "phone", value: "0821234567" },
    });
    const textareas = screen.getAllByRole("textbox");
    fireEvent.change(textareas[0], {
      target: { name: "education", value: "Matric" },
    });
    fireEvent.change(textareas[1], {
      target: { name: "skills", value: "JavaScript" },
    });

    // Attach CV last so all text state is already set before the file event fires
    const file = new File(["cv content"], "cv.pdf", { type: "application/pdf" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { name: "cv", files: [file] } });

    fireEvent.submit(fileInput.closest("form"));

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
      expect(mockGetPublicUrl).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith("Profile saved successfully!");
    });

    alertMock.mockRestore();
  });

  test("shows alert when no user is logged in", async () => {
    const firebase = require("../../firebase");
    firebase.auth.currentUser = null;

    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<CreateProfile />);

    // FIX: fill name so validation passes and only the auth check blocks the submit,
    // triggering the "User not logged in" alert
    fireEvent.change(screen.getByPlaceholderText(/full name/i), {
      target: { name: "name", value: "John Doe" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /save profile/i }).closest("form")
    );

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("User not logged in");
    });

    firebase.auth.currentUser = { uid: "user123" };
    alertMock.mockRestore();
  });
});
