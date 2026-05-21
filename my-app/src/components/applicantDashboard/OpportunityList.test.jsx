import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import OpportunityList from "./OpportunityList";
import { db, auth } from "../../firebase";
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
  doc: jest.fn(),
  getDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890 })),
  },
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
    type: "Learnership",

    // Match data to push score above 80
    sector: "Technology",
    minimumNqfLevel: 5,
    preferredLearningArea: "Software Development",
    requiredQualificationId: "QUAL123",
    requiredQualificationTitle: "Diploma in IT",
    requiredSkills: ["JavaScript", "React"],
    preferredSkills: ["Node.js", "SQL"],
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
    type: "Internship",
    sector: "Data",
  },
];

const mockApplications = [
  {
    id: "app1",
    opportunityId: "opp1",
    userId: "user123",
  },
];

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  onAuthStateChanged.mockImplementation((auth, callback) => {
    callback(mockUser);
    return jest.fn();
  });

  addDoc.mockResolvedValue({ id: "newDoc123" });

  query.mockReturnValue("mockedQuery");
  collection.mockReturnValue("mockedCollection");
  where.mockReturnValue("mockedWhere");
  doc.mockReturnValue("mockedDoc");

  getDoc.mockResolvedValue({
    exists: () => true,
    data: () => applicantProfile,
  });

  require("react-router-dom").useLocation.mockReturnValue({
    search: "",
    pathname: "/dashboard/applicant",
  });

  require("react-router-dom").useNavigate.mockReturnValue(mockNavigate);
});

// ─── Rendering ───────────────────────────────────────────────────────────────

describe("OpportunityList — rendering", () => {
  test("renders the opportunities section heading", async () => {
    getDocs.mockResolvedValue({ docs: [] });

    await act(async () => {
      render(<OpportunityList />);
    });

    expect(
      screen.getByText("Available Opportunities")
    ).toBeInTheDocument();
  });

  test("renders opportunities fetched from Firestore", async () => {
    getDocs.mockResolvedValue({
      docs: mockOpportunities.map((o) => ({
        id: o.id,
        data: () => o,
      })),
    });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Junior Developer Learnership")
      ).toBeInTheDocument();
    });
  });

  test("shows strong match badge when score is above 80", async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: "opp1",
          data: () => mockOpportunities[0],
        },
      ],
    });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(screen.getByText("Strong match")).toBeInTheDocument();
    });
  });

  test("shows empty message when no opportunities available", async () => {
    getDocs.mockResolvedValue({ docs: [] });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "No opportunities available at the moment."
        )
      ).toBeInTheDocument();
    });
  });

  test("renders opportunity meta data", async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: "opp1",
          data: () => mockOpportunities[0],
        },
      ],
    });

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

  test("renders both View Details and Apply Now buttons", async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: "opp1",
          data: () => mockOpportunities[0],
        },
      ],
    });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(screen.getByText("View Details")).toBeInTheDocument();
      expect(screen.getByText("Apply Now")).toBeInTheDocument();
    });
  });
});

// ─── Filtering ───────────────────────────────────────────────────────────────

describe("OpportunityList — filtering", () => {
  test("filters out opportunities already applied for", async () => {
    getDocs
      .mockResolvedValueOnce({
        docs: mockOpportunities.map((o) => ({
          id: o.id,
          data: () => o,
        })),
      })
      .mockResolvedValueOnce({
        docs: mockApplications.map((a) => ({
          id: a.id,
          data: () => a,
        })),
      });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Data Analyst Internship")
      ).toBeInTheDocument();

      expect(
        screen.queryByText("Junior Developer Learnership")
      ).not.toBeInTheDocument();
    });
  });

  test("search filters by title", async () => {
    getDocs.mockResolvedValue({
      docs: mockOpportunities.map((o) => ({
        id: o.id,
        data: () => o,
      })),
    });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Junior Developer Learnership")
      ).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByPlaceholderText(/Search by title/i),
      {
        target: { value: "data analyst" },
      }
    );

    await waitFor(() => {
      expect(
        screen.getByText("Data Analyst Internship")
      ).toBeInTheDocument();

      expect(
        screen.queryByText("Junior Developer Learnership")
      ).not.toBeInTheDocument();
    });
  });
});

// ─── Apply flow ──────────────────────────────────────────────────────────────

describe("OpportunityList — apply flow", () => {
  test("opens confirm modal when Apply Now clicked", async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: "opp1",
          data: () => mockOpportunities[0],
        },
      ],
    });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Junior Developer Learnership")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Apply Now"));

    await waitFor(() => {
      expect(
        screen.getByText("Confirm Application")
      ).toBeInTheDocument();
    });
  });

  test("submits application and notification", async () => {
    getDocs
      .mockResolvedValueOnce({
        docs: mockOpportunities.map((o) => ({
          id: o.id,
          data: () => o,
        })),
      })
      .mockResolvedValueOnce({
        docs: [],
      });

    addDoc.mockResolvedValue({
      id: "newApp123",
    });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Junior Developer Learnership")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("Apply Now")[0]);

    await waitFor(() => {
      expect(
        screen.getByText("Confirm Application")
      ).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Confirm & Submit"));
    });

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(2);
    });
  });

  test("shows success toast after applying", async () => {
    getDocs
      .mockResolvedValueOnce({
        docs: [
          {
            id: "opp1",
            data: () => mockOpportunities[0],
          },
        ],
      })
      .mockResolvedValueOnce({
        docs: [],
      });

    addDoc.mockResolvedValue({
      id: "newApp123",
    });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Junior Developer Learnership")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Apply Now"));

    await waitFor(() => {
      expect(
        screen.getByText("Confirm Application")
      ).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Confirm & Submit"));
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          /Application for "Junior Developer Learnership" submitted!/
        )
      ).toBeInTheDocument();
    });
  });
});

// ─── Detail modal ────────────────────────────────────────────────────────────

describe("OpportunityList — detail modal", () => {
  test("opens detail modal when View Details clicked", async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: "opp1",
          data: () => mockOpportunities[0],
        },
      ],
    });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(screen.getByText("View Details")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("View Details"));

    await waitFor(() => {
      expect(
        screen.getByText("About this opportunity")
      ).toBeInTheDocument();
    });
  });

  test("closes detail modal when close button clicked", async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: "opp1",
          data: () => mockOpportunities[0],
        },
      ],
    });

    await act(async () => {
      render(<OpportunityList />);
    });

    fireEvent.click(await screen.findByText("View Details"));

    fireEvent.click(await screen.findByLabelText("Close"));

    await waitFor(() => {
      expect(
        screen.queryByText("About this opportunity")
      ).not.toBeInTheDocument();
    });
  });
});

// ─── Query param auto-open ───────────────────────────────────────────────────

describe("OpportunityList — opportunityId query param", () => {
  test("auto-opens detail modal when query param exists", async () => {
    require("react-router-dom").useLocation.mockReturnValue({
      search: "?opportunityId=opp1",
      pathname: "/dashboard/applicant",
    });

    getDocs.mockResolvedValue({
      docs: mockOpportunities.map((o) => ({
        id: o.id,
        data: () => o,
      })),
    });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("About this opportunity")
      ).toBeInTheDocument();
    });
  });

  test("clears query param after opening modal", async () => {
    require("react-router-dom").useLocation.mockReturnValue({
      search: "?opportunityId=opp1",
      pathname: "/dashboard/applicant",
    });

    getDocs.mockResolvedValue({
      docs: mockOpportunities.map((o) => ({
        id: o.id,
        data: () => o,
      })),
    });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/dashboard/applicant",
        { replace: true }
      );
    });
  });

  test("does not open modal for invalid opportunityId", async () => {
    require("react-router-dom").useLocation.mockReturnValue({
      search: "?opportunityId=doesnotexist",
      pathname: "/dashboard/applicant",
    });

    getDocs.mockResolvedValue({
      docs: mockOpportunities.map((o) => ({
        id: o.id,
        data: () => o,
      })),
    });

    await act(async () => {
      render(<OpportunityList />);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Junior Developer Learnership")
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText("About this opportunity")
    ).not.toBeInTheDocument();
  });
});