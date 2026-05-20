import { render, screen, waitFor } from "@testing-library/react";
import Dashboard from "./Dashboard";
import { db, auth } from "../../firebase";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    Timestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

jest.mock("../../firebase", () => ({
    db:   {},
    auth: {},
}));

jest.mock("firebase/firestore", () => ({
    collection: jest.fn(),
    query:      jest.fn(),
    where:      jest.fn(),
    getDocs:    jest.fn(),
    addDoc:     jest.fn(),
    Timestamp:  { now: jest.fn(() => ({ seconds: 1234567890 })) },
}));

jest.mock("firebase/auth", () => ({
    onAuthStateChanged: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
    useNavigate: jest.fn(),
}));

jest.mock("./MyApplications",   () => () => <section>MyApplications</section>);
jest.mock("./OpportunityList",  () => () => <section>OpportunityList</section>);
jest.mock("./NotificationBell", () => () => <button>NotificationBell</button>);
jest.mock("./Dashboard.css",    () => ({}));

const mockNavigate = jest.fn();
const mockUser     = { uid: "user123" };

const mockApplications = [
    { id: "app1", opportunityId: "opp1", userId: "user123" },
    { id: "app2", opportunityId: "opp2", userId: "user123" },
];

const today     = new Date();
const in3Days   = new Date(today);
const in10Days  = new Date(today);
const yesterday = new Date(today);
in3Days.setDate(today.getDate() + 3);
in10Days.setDate(today.getDate() + 10);
yesterday.setDate(today.getDate() - 1);

const formatDate = (date) => date.toISOString().split("T")[0];

const mockOpportunities = [
    {
        id:          "opp1",
        title:       "Junior Developer Learnership",
        company:     "TechCorp",
        closingDate: formatDate(in3Days),
        status:      "approved",
    },
    {
        id:          "opp2",
        title:       "Data Analyst Internship",
        company:     "DataCo",
        closingDate: formatDate(in10Days),
        status:      "approved",
    },
    {
        id:          "opp3",
        title:       "UX Designer Internship",
        company:     "DesignCo",
        closingDate: formatDate(in3Days),
        status:      "approved",
    },
    {
        id:          "opp4",
        title:       "Expired Opportunity",
        company:     "OldCo",
        closingDate: formatDate(yesterday),
        status:      "approved",
    },
];

// Dashboard has a single useEffect that sequentially fetches:
//   call 1 → applications for the current user
//   call 2 → approved opportunities
//   calls 3+ → one dedup check per opportunity that passes the filters
function setupSmartGetDocs({
    applications    = mockApplications,
    opportunities   = mockOpportunities,
    dedupEmpty      = true,
    dedupDocs       = [],
} = {}) {
    let callCount = 0;

    getDocs.mockImplementation(() => {
        callCount++;

        const appResult = {
            empty: applications.length === 0,
            docs:  applications.map(a => ({ id: a.id, data: () => a })),
        };

        const oppResult = {
            empty: opportunities.length === 0,
            docs:  opportunities.map(o => ({ id: o.id, data: () => o })),
        };

        const dedupResult = dedupEmpty
            ? { empty: true, docs: [] }
            : {
                empty: false,
                docs:  dedupDocs.map((d, i) => ({ id: `dedup${i}`, data: () => d })),
            };

        if (callCount === 1) return Promise.resolve(appResult);
        if (callCount === 2) return Promise.resolve(oppResult);
        return Promise.resolve(dedupResult);
    });
}

beforeEach(() => {
    jest.clearAllMocks();

    useNavigate.mockReturnValue(mockNavigate);

    onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
    });

    query.mockReturnValue("mockedQuery");
    collection.mockReturnValue("mockedCollection");
    where.mockReturnValue("mockedWhere");
    addDoc.mockResolvedValue({ id: "notif123" });
});

describe("Dashboard", () => {

    test("renders child components", async () => {
        getDocs.mockResolvedValue({ docs: [], empty: true });

        render(<Dashboard />);

        expect(screen.getByText("MyApplications")).toBeInTheDocument();
        expect(screen.getByText("OpportunityList")).toBeInTheDocument();
        expect(screen.getByText("NotificationBell")).toBeInTheDocument();
    });

    test("renders My Profile button", () => {
        getDocs.mockResolvedValue({ docs: [], empty: true });

        render(<Dashboard />);

        expect(screen.getByText("My Profile")).toBeInTheDocument();
    });

    test("My Profile button navigates to profile page", async () => {
        getDocs.mockResolvedValue({ docs: [], empty: true });

        render(<Dashboard />);

        screen.getByText("My Profile").click();

        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/applicant/myProfile");
    });

    test("does nothing when user is not logged in", async () => {
        onAuthStateChanged.mockImplementation((auth, callback) => {
            callback(null);
            return jest.fn();
        });

        getDocs.mockResolvedValue({ docs: [], empty: true });

        render(<Dashboard />);

        await waitFor(() => {
            expect(addDoc).not.toHaveBeenCalled();
        });
    });

    test("does not write any notification when no opportunities exist", async () => {
        setupSmartGetDocs({
            applications:  [],
            opportunities: [],
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(addDoc).not.toHaveBeenCalled();
        });
    });

    test("writes closing soon notification for unapplied opportunity closing within 7 days", async () => {
        // opp3 closes in 3 days and is NOT in applications (opp1, opp2 are applied)
        setupSmartGetDocs({
            applications:  mockApplications,
            opportunities: mockOpportunities,
            dedupEmpty:    true,
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    userId: "user123",
                    type:   "closing_soon",
                    title:  "Opportunity closing soon!",
                })
            );
        });
    });

    test("does not write closing soon notification for opportunity closing beyond 7 days", async () => {
        // opp2 closes in 10 days — beyond threshold — and no one applied
        setupSmartGetDocs({
            applications:  [],
            opportunities: [mockOpportunities[1]],
            dedupEmpty:    true,
        });

        render(<Dashboard />);

        await waitFor(() => {
            // Only new_opportunity notification should fire, not closing_soon
            expect(addDoc).not.toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: "closing_soon" })
            );
        });
    });

    test("does not write closing soon notification for already closed opportunity", async () => {
        // opp4 closed yesterday
        setupSmartGetDocs({
            applications:  [],
            opportunities: [mockOpportunities[3]],
            dedupEmpty:    true,
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(addDoc).not.toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: "closing_soon" })
            );
        });
    });

    test("does not write closing soon notification for opportunity user already applied for", async () => {
        // opp1 closes in 3 days but user already applied
        setupSmartGetDocs({
            applications:  mockApplications,
            opportunities: [mockOpportunities[0]],
            dedupEmpty:    true,
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(addDoc).not.toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: "closing_soon" })
            );
        });
    });

    test("does not write duplicate closing soon notification if already sent today", async () => {
        setupSmartGetDocs({
            applications:  [],
            opportunities: [mockOpportunities[2]], // opp3 closes in 3 days
            dedupEmpty:    false,
            dedupDocs:     [{
                createdAt: { toDate: () => new Date() },
            }],
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(addDoc).not.toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: "closing_soon" })
            );
        });
    });

    test("writes new opportunity notification for unapplied opportunity", async () => {
        // opp2 closes in 10 days — no closing soon — but IS a new opportunity
        setupSmartGetDocs({
            applications:  [],
            opportunities: [mockOpportunities[1]],
            dedupEmpty:    true,
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    userId: "user123",
                    type:   "new_opportunity",
                    title:  "New opportunity available!",
                })
            );
        });
    });

    test("does not write new opportunity notification if already sent before", async () => {
        setupSmartGetDocs({
            applications:  [],
            opportunities: [mockOpportunities[1]],
            dedupEmpty:    false,
            dedupDocs:     [{}],
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(addDoc).not.toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: "new_opportunity" })
            );
        });
    });

    test("does not write new opportunity notification for opportunity user already applied for", async () => {
        // opp1 and opp2 both already applied for
        setupSmartGetDocs({
            applications:  mockApplications,
            opportunities: [mockOpportunities[0], mockOpportunities[1]],
            dedupEmpty:    true,
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(addDoc).not.toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: "new_opportunity" })
            );
        });
    });
});