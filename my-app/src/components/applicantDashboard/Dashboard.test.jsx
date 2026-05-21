import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Dashboard from "./Dashboard";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("../../firebase", () => ({
  db: {},
  auth: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({
      seconds: 1234567890,
    })),
  },
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock("./MyApplications", () => () => (
  <section>MyApplications</section>
));

jest.mock("./OpportunityList", () => () => (
  <section>OpportunityList</section>
));

jest.mock("./NotificationBell", () => () => (
  <button>NotificationBell</button>
));

jest.mock("./Dashboard.css", () => ({}));

// ─── Constants ───────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();

const mockUser = {
  uid: "user123",
};

const mockApplications = [
  {
    id: "app1",
    opportunityId: "opp1",
    userId: "user123",
  },

  {
    id: "app2",
    opportunityId: "opp2",
    userId: "user123",
  },
];

const today = new Date();

const in3Days = new Date(today);
in3Days.setDate(today.getDate() + 3);

const in10Days = new Date(today);
in10Days.setDate(today.getDate() + 10);

const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const formatDate = (date) =>
  date.toISOString().split("T")[0];

const mockOpportunities = [
  {
    id: "opp1",
    title: "Junior Developer Learnership",
    company: "TechCorp",
    closingDate: formatDate(in3Days),
    status: "approved",
  },

  {
    id: "opp2",
    title: "Data Analyst Internship",
    company: "DataCo",
    closingDate: formatDate(in10Days),
    status: "approved",
  },

  {
    id: "opp3",
    title: "UX Designer Internship",
    company: "DesignCo",
    closingDate: formatDate(in3Days),
    status: "approved",
  },

  {
    id: "opp4",
    title: "Expired Opportunity",
    company: "OldCo",
    closingDate: formatDate(yesterday),
    status: "approved",
  },
];

// ─── Smart Firestore Mock ────────────────────────────────────────────────────

function setupSmartGetDocs({
  applications = mockApplications,
  opportunities = mockOpportunities,
  dedupEmpty = true,
  dedupDocs = [],
} = {}) {
  let callCount = 0;

  getDocs.mockImplementation(() => {
    callCount++;

    const appResult = {
      empty: applications.length === 0,

      docs: applications.map((a) => ({
        id: a.id,
        data: () => a,
      })),
    };

    const oppResult = {
      empty: opportunities.length === 0,

      docs: opportunities.map((o) => ({
        id: o.id,
        data: () => o,
      })),
    };

    const dedupResult = dedupEmpty
      ? {
          empty: true,
          docs: [],
        }
      : {
          empty: false,

          docs: dedupDocs.map((d, i) => ({
            id: `dedup${i}`,
            data: () => d,
          })),
        };

    // applications query
    if (callCount === 1) {
      return Promise.resolve(appResult);
    }

    // opportunities query
    if (callCount === 2) {
      return Promise.resolve(oppResult);
    }

    // dedup notification query
    return Promise.resolve(dedupResult);
  });
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  useNavigate.mockReturnValue(mockNavigate);

  useLocation.mockReturnValue({
    pathname: "/dashboard/applicant",
  });

  onAuthStateChanged.mockImplementation(
    (auth, callback) => {
      callback(mockUser);
      return jest.fn();
    }
  );

  query.mockReturnValue("mockedQuery");

  collection.mockReturnValue("mockedCollection");

  where.mockReturnValue("mockedWhere");

  addDoc.mockResolvedValue({
    id: "notif123",
  });
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Dashboard", () => {
  test("renders child components", async () => {
    getDocs.mockResolvedValue({
      docs: [],
      empty: true,
    });

    render(<Dashboard />);

    expect(
      screen.getByText("MyApplications")
    ).toBeInTheDocument();

    expect(
      screen.getByText("OpportunityList")
    ).toBeInTheDocument();

    expect(
      screen.getByText("NotificationBell")
    ).toBeInTheDocument();
  });

  test("renders My Profile button", () => {
    getDocs.mockResolvedValue({
      docs: [],
      empty: true,
    });

    render(<Dashboard />);

    expect(
      screen.getByText("My Profile")
    ).toBeInTheDocument();
  });

  test("My Profile button navigates correctly", () => {
    getDocs.mockResolvedValue({
      docs: [],
      empty: true,
    });

    render(<Dashboard />);

    fireEvent.click(
      screen.getByText("My Profile")
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      "/dashboard/applicant/myProfile"
    );
  });

  test("does nothing when user not logged in", async () => {
    onAuthStateChanged.mockImplementation(
      (auth, callback) => {
        callback(null);
        return jest.fn();
      }
    );

    getDocs.mockResolvedValue({
      docs: [],
      empty: true,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(addDoc).not.toHaveBeenCalled();
    });
  });

  test("does not write notifications when no opportunities exist", async () => {
    setupSmartGetDocs({
      applications: [],
      opportunities: [],
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(addDoc).not.toHaveBeenCalled();
    });
  });

  test("writes closing soon notification", async () => {
    setupSmartGetDocs({
      applications: mockApplications,
      opportunities: mockOpportunities,
      dedupEmpty: true,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),

        expect.objectContaining({
          userId: "user123",
          type: "closing_soon",
          title: "Opportunity closing soon!",
        })
      );
    });
  });

  test("does not notify for opportunities closing after 7 days", async () => {
    setupSmartGetDocs({
      applications: [],
      opportunities: [mockOpportunities[1]],
      dedupEmpty: true,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(addDoc).not.toHaveBeenCalledWith(
        expect.anything(),

        expect.objectContaining({
          type: "closing_soon",
        })
      );
    });
  });

  test("does not notify for expired opportunities", async () => {
    setupSmartGetDocs({
      applications: [],
      opportunities: [mockOpportunities[3]],
      dedupEmpty: true,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(addDoc).not.toHaveBeenCalledWith(
        expect.anything(),

        expect.objectContaining({
          type: "closing_soon",
        })
      );
    });
  });

  test("does not notify for already applied opportunity", async () => {
    setupSmartGetDocs({
      applications: mockApplications,
      opportunities: [mockOpportunities[0]],
      dedupEmpty: true,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(addDoc).not.toHaveBeenCalledWith(
        expect.anything(),

        expect.objectContaining({
          type: "closing_soon",
        })
      );
    });
  });

  test("does not create duplicate closing soon notification", async () => {
    setupSmartGetDocs({
      applications: [],
      opportunities: [mockOpportunities[2]],

      dedupEmpty: false,

      dedupDocs: [
        {
          createdAt: {
            toDate: () => new Date(),
          },
        },
      ],
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(addDoc).not.toHaveBeenCalledWith(
        expect.anything(),

        expect.objectContaining({
          type: "closing_soon",
        })
      );
    });
  });

  test("writes new opportunity notification", async () => {
    setupSmartGetDocs({
      applications: [],
      opportunities: [mockOpportunities[1]],
      dedupEmpty: true,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),

        expect.objectContaining({
          userId: "user123",
          type: "new_opportunity",
          title: "New opportunity available!",
        })
      );
    });
  });

  test("does not duplicate new opportunity notification", async () => {
    setupSmartGetDocs({
      applications: [],
      opportunities: [mockOpportunities[1]],

      dedupEmpty: false,

      dedupDocs: [{}],
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(addDoc).not.toHaveBeenCalledWith(
        expect.anything(),

        expect.objectContaining({
          type: "new_opportunity",
        })
      );
    });
  });

  test("does not notify for already applied new opportunity", async () => {
    setupSmartGetDocs({
      applications: mockApplications,
      opportunities: [
        mockOpportunities[0],
        mockOpportunities[1],
      ],

      dedupEmpty: true,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(addDoc).not.toHaveBeenCalledWith(
        expect.anything(),

        expect.objectContaining({
          type: "new_opportunity",
        })
      );
    });
  });
});