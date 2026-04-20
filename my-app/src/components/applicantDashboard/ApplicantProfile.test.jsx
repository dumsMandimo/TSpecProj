import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ApplicantProfile from "./ApplicantProfile";

const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children }) => children,
}));

jest.mock("../../firebase", () => ({
  db: {},
  auth: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  getFirestore: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
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

const mockProfile = {
  id: "user123",
  name: "John Doe",
  phone: "0821234567",
  education: "BSc Computer Science",
  skills: "React, Firebase",
  interests: "Tech, Gaming",
  province: "Gauteng",
  qualification: "NQF 7",
  cvUrl: "https://example.com/cv.pdf",
};

function setupAuthAndProfile(overrides = {}) {
  const { onAuthStateChanged } = require("firebase/auth");
  const { getDoc, doc } = require("firebase/firestore");

  onAuthStateChanged.mockImplementation((auth, callback) => {
    callback({ uid: "user123" });
    return () => {};
  });

  getDoc.mockResolvedValue({
    exists: () => true,
    id: "user123",
    data: () => ({ ...mockProfile, ...overrides }),
  });

  doc.mockReturnValue({});
}

describe("ApplicantProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpload.mockResolvedValue({ data: {}, error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://supabase.co/storage/cvs/cv.pdf" },
    });
  });

  test("shows loading state initially", () => {
    const { onAuthStateChanged } = require("firebase/auth");
    onAuthStateChanged.mockImplementation(() => () => {});
    render(<ApplicantProfile />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("renders profile details after loading", async () => {
    setupAuthAndProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.getByText(/my profile/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByText(/0821234567/i)).toBeInTheDocument();
    expect(screen.getByText(/gauteng/i)).toBeInTheDocument();
    expect(screen.getByText(/bsc computer science/i)).toBeInTheDocument();
    expect(screen.getByText(/react, firebase/i)).toBeInTheDocument();
    expect(screen.getByText(/tech, gaming/i)).toBeInTheDocument();
    expect(screen.getByText(/nqf 7/i)).toBeInTheDocument();
  });

  test("renders CV link when cvUrl exists", async () => {
    setupAuthAndProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.getByText(/download cv/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/download cv/i).closest("a")).toHaveAttribute(
      "href",
      "https://example.com/cv.pdf"
    );
  });

  test("does not render CV link when cvUrl is missing", async () => {
    setupAuthAndProfile({ cvUrl: null });
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.getByText(/update profile/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/download cv/i)).not.toBeInTheDocument();
  });

  test("switches to edit mode when Update Profile is clicked", async () => {
    setupAuthAndProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByText(/update profile/i));
    });
    expect(screen.getByText(/save changes/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/john doe/i)).toBeInTheDocument();
  });

  test("updates name field in edit mode", async () => {
    setupAuthAndProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByText(/update profile/i));
    });
    const nameInput = screen.getByDisplayValue(/john doe/i);
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    expect(nameInput.value).toBe("Jane Doe");
  });

  test("updates phone field in edit mode", async () => {
    setupAuthAndProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByText(/update profile/i));
    });
    const phoneInput = screen.getByDisplayValue(/0821234567/i);
    fireEvent.change(phoneInput, { target: { value: "0999999999" } });
    expect(phoneInput.value).toBe("0999999999");
  });

  test("updates province select in edit mode", async () => {
    setupAuthAndProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByText(/update profile/i));
    });
    const select = screen.getByDisplayValue(/gauteng/i);
    fireEvent.change(select, { target: { value: "Western Cape" } });
    expect(select.value).toBe("Western Cape");
  });

  test("renders all province options in edit mode", async () => {
    setupAuthAndProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByText(/update profile/i));
    });
    expect(screen.getByText(/western cape/i)).toBeInTheDocument();
    expect(screen.getByText(/kwazulu-natal/i)).toBeInTheDocument();
    expect(screen.getByText(/limpopo/i)).toBeInTheDocument();
    expect(screen.getByText(/mpumalanga/i)).toBeInTheDocument();
  });

  test("saves profile without new CV on handleUpdate", async () => {
    const { updateDoc, doc } = require("firebase/firestore");
    updateDoc.mockResolvedValue();
    doc.mockReturnValue({});

    const { auth } = require("../../firebase");
    auth.currentUser = { uid: "user123" };

    setupAuthAndProfile();
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<ApplicantProfile />);

    await waitFor(() => {
      fireEvent.click(screen.getByText(/update profile/i));
    });

    fireEvent.click(screen.getByText(/save changes/i));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith("Profile updated!");
    });

    alertMock.mockRestore();
  });

  test("saves profile with new CV upload on handleUpdate", async () => {
    const { updateDoc, doc } = require("firebase/firestore");
    updateDoc.mockResolvedValue();
    doc.mockReturnValue({});

    const { auth } = require("../../firebase");
    auth.currentUser = { uid: "user123" };

    setupAuthAndProfile();
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<ApplicantProfile />);

    await waitFor(() => {
      fireEvent.click(screen.getByText(/update profile/i));
    });

    const file = new File(["new cv"], "new-cv.pdf", { type: "application/pdf" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByText(/save changes/i));

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
      expect(mockGetPublicUrl).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith("Profile updated!");
    });

    alertMock.mockRestore();
  });

  test("handles missing profile gracefully", async () => {
    const { onAuthStateChanged } = require("firebase/auth");
    const { getDoc, doc } = require("firebase/firestore");

    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: "user123" });
      return () => {};
    });

    getDoc.mockResolvedValue({ exists: () => false });
    doc.mockReturnValue({});

    render(<ApplicantProfile />);

    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  test("handles unauthenticated user gracefully", async () => {
    const { onAuthStateChanged } = require("firebase/auth");
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return () => {};
    });

    render(<ApplicantProfile />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
