import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import MyApplications from "./MyApplications";

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children }) => children,
}));

jest.mock("../../firebase", () => ({
  db: {},
  auth: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDoc: jest.fn(),
  onSnapshot: jest.fn(),
  getFirestore: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));

const mockApplications = [
  {
    id: "app1",
    title: "Software Internship",
    company: "TechCorp",
    status: "Submitted",
    stageIndex: 0,
  },
  {
    id: "app2",
    title: "Data Learnership",
    company: "DataCo",
    status: "Under Evaluation",
    stageIndex: 2,
  },
];

describe("MyApplications", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { onAuthStateChanged } = require("firebase/auth");
    const { query, where, collection, onSnapshot, doc, getDoc } =
      require("firebase/firestore");

    collection.mockReturnValue({});
    query.mockReturnValue({});
    where.mockReturnValue({});
    doc.mockReturnValue({});

    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: "user123" });
      return () => {};
    });

    onSnapshot.mockImplementation((q, callback) => {
      callback({
        docs: mockApplications.map((app) => ({
          id: app.id,
          data: () => app,
        })),
      });
      return () => {};
    });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: "John Doe" }),
    });
  });

  test("renders page header", async () => {
    render(<MyApplications />);

    await waitFor(() => {
      expect(screen.getByText(/my applications/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/career dashboard/i)).toBeInTheDocument();
  });

  test("renders welcome message with user name", async () => {
    render(<MyApplications />);

    await waitFor(() => {
      expect(screen.getByText(/welcome back, john doe/i)).toBeInTheDocument();
    });
  });

  test("renders list of applications", async () => {
    render(<MyApplications />);

    await waitFor(() => {
      expect(screen.getByText(/software internship/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/data learnership/i)).toBeInTheDocument();
    expect(screen.getByText(/techcorp/i)).toBeInTheDocument();
    expect(screen.getByText(/dataco/i)).toBeInTheDocument();
  });

  test("renders progress tracker stages for each application", async () => {
    render(<MyApplications />);

    await waitFor(() => {
      expect(screen.getByText(/software internship/i)).toBeInTheDocument();
    });

    // All 4 stages should appear (rendered per application, so at least once each)
    expect(screen.getAllByText(/submitted/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/received/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/under evaluation/i).length).toBeGreaterThan(0);
  });

  test("renders Accepted label at Final Decision stage when status is Accepted", async () => {
    const { onSnapshot } = require("firebase/firestore");

    onSnapshot.mockImplementation((q, callback) => {
      callback({
        docs: [
          {
            id: "app3",
            data: () => ({
              id: "app3",
              title: "Accepted Job",
              company: "Corp",
              status: "Accepted",
              stageIndex: 3,
            }),
          },
        ],
      });
      return () => {};
    });

    render(<MyApplications />);

    await waitFor(() => {
      expect(screen.getByText(/accepted job/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Accepted")).toBeInTheDocument();
  });

  test("renders Rejected label at Final Decision stage when status is Rejected", async () => {
    const { onSnapshot } = require("firebase/firestore");

    onSnapshot.mockImplementation((q, callback) => {
      callback({
        docs: [
          {
            id: "app4",
            data: () => ({
              id: "app4",
              title: "Rejected Job",
              company: "Corp",
              status: "Rejected",
              stageIndex: 3,
            }),
          },
        ],
      });
      return () => {};
    });

    render(<MyApplications />);

    await waitFor(() => {
      expect(screen.getByText(/rejected job/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  test("renders Shortlisted label at Final Decision stage when status is Shortlisted", async () => {
    const { onSnapshot } = require("firebase/firestore");

    onSnapshot.mockImplementation((q, callback) => {
      callback({
        docs: [
          {
            id: "app5",
            data: () => ({
              id: "app5",
              title: "Shortlisted Job",
              company: "Corp",
              status: "Shortlisted",
              stageIndex: 3,
            }),
          },
        ],
      });
      return () => {};
    });

    render(<MyApplications />);

    await waitFor(() => {
      expect(screen.getByText(/shortlisted job/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Shortlisted")).toBeInTheDocument();
  });

  test("renders empty state when user has no applications", async () => {
    const { onSnapshot } = require("firebase/firestore");

    onSnapshot.mockImplementation((q, callback) => {
      callback({ docs: [] });
      return () => {};
    });

    render(<MyApplications />);

    await waitFor(() => {
      expect(screen.getByText(/my applications/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/techcorp/i)).not.toBeInTheDocument();
  });

  test("renders fallback username when user has no name", async () => {
    const { getDoc } = require("firebase/firestore");

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: "" }),
    });

    render(<MyApplications />);

    await waitFor(() => {
      expect(screen.getByText(/welcome back, user/i)).toBeInTheDocument();
    });
  });

  test("does not crash when no user is logged in", async () => {
    const { onAuthStateChanged } = require("firebase/auth");

    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return () => {};
    });

    render(<MyApplications />);

    await waitFor(() => {
      expect(screen.getByText(/my applications/i)).toBeInTheDocument();
    });
  });
});
