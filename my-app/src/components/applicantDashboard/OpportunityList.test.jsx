import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import OpportunityList from "./OpportunityList";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("../../firebase", () => ({
  db: {},
  auth: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890 })),
  },
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock("./OpportunityList.css", () => ({}));

// react-router mocks
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useLocation: jest.fn(() => ({
    search: "",
    pathname: "/dashboard/applicant",
  })),
  useNavigate: jest.fn(() => mockNavigate),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockUser = { uid: "user123" };

const applicantProfile = {
  sector: "Technology",
  nqfLevel: 6,
  qualification: "NQF Level 6",
  saqaLearningArea: "Software Development",
  learningSubfield: "Software Development",
  saqaQualificationId: "QUAL123",
  qualificationTitle: "Diploma in IT",
  skills: ["JavaScript", "React", "Node.js", "SQL"],
};

const mockOpportunities = [
  {
    id: "opp1",
    title: "Junior Developer Learnership",
    description: "A great opportunity",
    location: "Johannesburg",
    stipend: "R5000/month",
    closingDate: "2026-12-31",
    company: "TechCorp",
    status: "approved",
  },
  {
    id: "opp2",
    title: "Data Analyst Internship",
    description: "Data focused role",
    location: "Cape Town",
    stipend: "R4000/month",
    closingDate: "2026-11-30",
    company: "DataCo",
    status: "approved",
  },
];

const mockApplications = [
  {
    id: "app1",
    opportunityId: "opp1",
    userId: "user123",
  },
];

function mockOpportunityDocs(opportunities) {
  return {
    docs: opportunities.map((opp) => ({
      id: opp.id,
      data: () => opp,
    })),
  };
}

function mockApplicationDocs(applications) {
  return {
    docs: applications.map((app) => ({
      id: app.id,
      data: () => app,
    })),
  };
}

beforeEach(() => {
  jest.clearAllMocks();

  onAuthStateChanged.mockImplementation((auth, callback) => {
    callback(mockUser);
    return jest.fn();
  });

  doc.mockReturnValue("mockedDocRef");
  addDoc.mockResolvedValue({ id: "newDoc123" });
  query.mockReturnValue("mockedQuery");
  collection.mockReturnValue("mockedCollection");
  where.mockReturnValue("mockedWhere");
  getDoc.mockResolvedValue({ exists: () => false });

  // Default: empty opportunities + empty applications
  getDocs
    .mockResolvedValueOnce({ docs: [] })
    .mockResolvedValueOnce({ docs: [] });
});

describe("OpportunityList", () => {
  test("renders the opportunities section heading", async () => {
    getDocs
      .mockReset()
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });

    await act(async () => {
      render(<OpportunityList />);
    });

    expect(screen.getByText("Available Opportunities")).toBeInTheDocument();
  });

  test("renders opportunities fetched from Firestore", async () => {
    getDocs
      .mockReset()
      .mockResolvedValueOnce(mockOpportunityDocs(mockOpportunities))
      .mockResolvedValueOnce({ docs: [] });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Junior Developer Learnership")
      ).toBeInTheDocument();
    });
  });

  test("shows empty message when no opportunities available", async () => {
    getDocs
      .mockReset()
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("No opportunities available at the moment.")
      ).toBeInTheDocument();
    });
  });

  test("filters out opportunities the user already applied for", async () => {
    getDocs
      .mockReset()
      .mockResolvedValueOnce(mockOpportunityDocs(mockOpportunities))
      .mockResolvedValueOnce(mockApplicationDocs(mockApplications));

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(screen.getByText("Data Analyst Internship")).toBeInTheDocument();
      expect(
        screen.queryByText("Junior Developer Learnership")
      ).not.toBeInTheDocument();
    });
  });

  test("shows alert when user is not logged in and tries to apply", async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn();
    });

    getDocs
      .mockReset()
      .mockResolvedValueOnce(mockOpportunityDocs(mockOpportunities));

    window.alert = jest.fn();

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Junior Developer Learnership")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("Apply Now")[0]);

    expect(window.alert).toHaveBeenCalledWith("Please log in first");
  });

  test("submits application and writes notification to Firestore", async () => {
    getDocs
      .mockReset()
      .mockResolvedValueOnce(mockOpportunityDocs(mockOpportunities))
      .mockResolvedValueOnce({ docs: [] });

    window.alert = jest.fn();
    addDoc.mockResolvedValue({ id: "newApp123" });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Junior Developer Learnership")
      ).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getAllByText("Apply Now")[0]);
    });

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(2);
      expect(window.alert).toHaveBeenCalledWith("Application submitted!");
    });
  });

  test("removes opportunity from list after successful application", async () => {
    getDocs
      .mockReset()
      .mockResolvedValueOnce(mockOpportunityDocs(mockOpportunities))
      .mockResolvedValueOnce({ docs: [] });

    window.alert = jest.fn();
    addDoc.mockResolvedValue({ id: "newApp123" });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Junior Developer Learnership")
      ).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getAllByText("Apply Now")[0]);
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Application submitted!");
      expect(
        screen.queryByText("Junior Developer Learnership")
      ).not.toBeInTheDocument();
    });
  });

  test("renders opportunity details correctly", async () => {
    getDocs
      .mockReset()
      .mockResolvedValueOnce(mockOpportunityDocs([mockOpportunities[0]]))
      .mockResolvedValueOnce({ docs: [] });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Johannesburg/)).toBeInTheDocument();
      expect(screen.getByText(/R5000\/month/)).toBeInTheDocument();
      expect(screen.getByText(/2026-12-31/)).toBeInTheDocument();
      expect(screen.getByText(/TechCorp/)).toBeInTheDocument();
    });
  });

  test("renders strong match when applicant qualifications align", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        skills: ["javascript", "react"],
        educationHistory: [
          {
            sector: "Technology",
            qualification: "NQF Level 6",
            qualificationTitle: "Software Engineering",
            saqaLearningArea: "Software Development",
          },
        ],
      }),
    });

    getDocs
      .mockReset()
      .mockResolvedValueOnce({
        docs: [
          {
            id: "opp1",
            data: () => ({
              title: "Frontend Internship",
              company: "TechCorp",
              status: "approved",
              sector: "Technology",
              minimumNqfLevel: 5,
              preferredLearningArea: "Software Development",
              requiredSkills: ["javascript", "react"],
            }),
          },
        ],
      })
      .mockResolvedValueOnce({ docs: [] });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(screen.getByText("Strong match")).toBeInTheDocument();
    });
  });

  test("shows error alert when application submission fails", async () => {
    getDoc.mockResolvedValue({ exists: () => false });

    getDocs
      .mockReset()
      .mockResolvedValueOnce(mockOpportunityDocs([mockOpportunities[0]]))
      .mockResolvedValueOnce({ docs: [] });

    addDoc.mockRejectedValue(new Error("Firestore failure"));
    window.alert = jest.fn();

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Junior Developer Learnership")
      ).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Apply Now"));
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Failed to submit application. Please try again."
      );
    });
  });

  test("calls onApplicationAdded after successful apply", async () => {
    const mockCallback = jest.fn();

    getDoc.mockResolvedValue({ exists: () => false });

    getDocs
      .mockReset()
      .mockResolvedValueOnce(mockOpportunityDocs([mockOpportunities[0]]))
      .mockResolvedValueOnce({ docs: [] });

    addDoc.mockResolvedValue({ id: "newApp123" });
    window.alert = jest.fn();

    await act(async () => {
      render(<OpportunityList onApplicationAdded={mockCallback} />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Junior Developer Learnership")
      ).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Apply Now"));
    });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  test("renders company website link when companyUrl exists", async () => {
    getDoc.mockResolvedValue({ exists: () => false });

    getDocs
      .mockReset()
      .mockResolvedValueOnce({
        docs: [
          {
            id: "opp1",
            data: () => ({
              ...mockOpportunities[0],
              companyUrl: "https://techcorp.com",
            }),
          },
        ],
      })
      .mockResolvedValueOnce({ docs: [] });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(screen.getByText(/More about TechCorp/i)).toBeInTheDocument();
    });
  });

  test("renders required and preferred skills", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        skills: ["react"],
      }),
    });

    getDocs
      .mockReset()
      .mockResolvedValueOnce({
        docs: [
          {
            id: "opp1",
            data: () => ({
              ...mockOpportunities[0],
              requiredSkills: ["react", "javascript"],
              preferredSkills: ["figma"],
            }),
          },
        ],
      })
      .mockResolvedValueOnce({ docs: [] });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(screen.getByText("react")).toBeInTheDocument();
      expect(screen.getByText("javascript")).toBeInTheDocument();
      expect(screen.getByText("figma")).toBeInTheDocument();
    });
  });

  test("handles applicant profile fetch error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    getDoc.mockRejectedValue(new Error("profile error"));

    getDocs
      .mockReset()
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching applicant profile:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  test("handles opportunities fetch failure", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    getDocs
      .mockReset()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce({ docs: [] });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching opportunities:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});