import { within } from "@testing-library/react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import MyApplications from "./MyApplications";
import { db, auth } from "../../firebase";
import {
    collection,
    doc,
    query,
    where,
    getDoc,
    onSnapshot,
    addDoc,
    Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("../../firebase", () => ({
    db:   {},
    auth: {},
}));

jest.mock("firebase/firestore", () => ({
    collection: jest.fn(),
    doc:        jest.fn(),
    query:      jest.fn(),
    where:      jest.fn(),
    getDoc:     jest.fn(),
    onSnapshot: jest.fn(),
    addDoc:     jest.fn(),
    Timestamp:  { now: jest.fn(() => ({ seconds: 1234567890 })) },
}));

jest.mock("firebase/auth", () => ({
    onAuthStateChanged: jest.fn(),
}));

jest.mock("./MyApplications.css", () => ({}));
jest.mock("./Dashboard.css",      () => ({}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockUser = { uid: "user123" };

const mockApplications = [
    {
        id:        "app1",
        title:     "Junior Developer Learnership",
        company:   "TechCorp",
        status:    "Submitted",
        userId:    "user123",
        appliedAt: { toMillis: () => 1000, toDate: () => new Date("2026-05-01") },
    },
    {
        id:        "app2",
        title:     "Data Analyst Internship",
        company:   "DataCo",
        status:    "Shortlisted",
        userId:    "user123",
        appliedAt: { toMillis: () => 2000, toDate: () => new Date("2026-05-10") },
    },
];

beforeEach(() => {
    jest.clearAllMocks();

    onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
    });

    getDoc.mockResolvedValue({
        exists: () => true,
        data:   () => ({ name: "Peace" }),
    });

    onSnapshot.mockImplementation((q, successCallback) => {
        successCallback({
            docs: mockApplications.map(app => ({ id: app.id, data: () => app })),
        });
        return jest.fn();
    });

    addDoc.mockResolvedValue({ id: "notif123" });
    query.mockReturnValue("mockedQuery");
    collection.mockReturnValue("mockedCollection");
    where.mockReturnValue("mockedWhere");
    doc.mockReturnValue("mockedDoc");
});

// ─── Rendering ───────────────────────────────────────────────────────────────

describe("MyApplications — rendering", () => {

    test("renders the My Applications heading", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("My Applications")).toBeInTheDocument();
        });
    });

    test("renders welcome message with user name", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Welcome back, Peace")).toBeInTheDocument();
        });
    });

    test("renders application cards fetched from Firestore", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
            expect(screen.getByText("Data Analyst Internship")).toBeInTheDocument();
        });
    });

    test("shows empty message when user has no applications", async () => {
        onSnapshot.mockImplementation((q, successCallback) => {
            successCallback({ docs: [] });
            return jest.fn();
        });

        render(<MyApplications />);

        await waitFor(() => {
            expect(
                screen.getByText("You have not applied to any opportunities yet.")
            ).toBeInTheDocument();
        });
    });

    test("clears applications when user is not logged in", async () => {
        onAuthStateChanged.mockImplementation((auth, callback) => {
            callback(null);
            return jest.fn();
        });

        render(<MyApplications />);

        await waitFor(() => {
            expect(
                screen.getByText("You have not applied to any opportunities yet.")
            ).toBeInTheDocument();
        });
    });

    test("renders filter bar when there are applications", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText("Search applications…")).toBeInTheDocument();
        });
    });

    test("does not render filter bar when there are no applications", async () => {
        onSnapshot.mockImplementation((q, successCallback) => {
            successCallback({ docs: [] });
            return jest.fn();
        });

        render(<MyApplications />);

        await waitFor(() => {
            expect(
                screen.queryByPlaceholderText("Search applications…")
            ).not.toBeInTheDocument();
        });
    });

    test("renders company name on each application card", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("TechCorp")).toBeInTheDocument();
            expect(screen.getByText("DataCo")).toBeInTheDocument();
        });
    });

    test("renders applied date on each card", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getAllByText(/Applied/).length).toBeGreaterThan(0);
        });
    });

    test("renders click to view details prompt on each card", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getAllByText("Click to view details →").length).toBe(2);
        });
    });
});

// ─── Filter & sort ────────────────────────────────────────────────────────────

describe("MyApplications — filter and sort", () => {

    test("search filters applications by title", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText("Search applications…"), {
            target: { value: "data analyst" },
        });

        await waitFor(() => {
            expect(screen.getByText("Data Analyst Internship")).toBeInTheDocument();
            expect(screen.queryByText("Junior Developer Learnership")).not.toBeInTheDocument();
        });
    });

    test("search filters applications by company", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("TechCorp")).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText("Search applications…"), {
            target: { value: "DataCo" },
        });

        await waitFor(() => {
            expect(screen.getByText("DataCo")).toBeInTheDocument();
            expect(screen.queryByText("TechCorp")).not.toBeInTheDocument();
        });
    });

    test("clear search button resets search query", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText("Search applications…"), {
            target: { value: "data" },
        });

        await waitFor(() => {
            expect(screen.queryByText("Junior Developer Learnership")).not.toBeInTheDocument();
        });

        fireEvent.click(screen.getByLabelText("Clear search"));

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });
    });

    test("status filter pill filters by Submitted", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: "Submitted" }));

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
            expect(screen.queryByText("Data Analyst Internship")).not.toBeInTheDocument();
        });
    });

    test("shows no-match message when filter matches nothing", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: "Rejected" }));

        await waitFor(() => {
            expect(
                screen.getByText("No applications match your filters.")
            ).toBeInTheDocument();
        });
    });

    test("result count updates when filter is applied", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("2 applications")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: "Submitted" }));

        await waitFor(() => {
            expect(screen.getByText("1 application")).toBeInTheDocument();
        });
    });
});

// ─── Detail modal ─────────────────────────────────────────────────────────────

describe("MyApplications — detail modal", () => {

    test("opens detail modal when a card is clicked", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Junior Developer Learnership"));

        await waitFor(() => {
            expect(screen.getByText("Application Progress")).toBeInTheDocument();
        });
    });

    test("closes detail modal when close button is clicked", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Junior Developer Learnership"));

        await waitFor(() => {
            expect(screen.getByText("Application Progress")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByLabelText("Close"));

        await waitFor(() => {
            expect(screen.queryByText("Application Progress")).not.toBeInTheDocument();
        });
    });

    test("closes detail modal when backdrop is clicked", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Junior Developer Learnership"));
        await waitFor(() => { expect(screen.getByRole("dialog")).toBeInTheDocument(); });

        fireEvent.click(screen.getByRole("dialog"));

        await waitFor(() => {
            expect(screen.queryByText("Application Progress")).not.toBeInTheDocument();
        });
    });

    test("modal shows status message for Shortlisted application", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Data Analyst Internship")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Data Analyst Internship"));

        await waitFor(() => {
            expect(
                screen.getByText("Great news! You have been shortlisted.")
            ).toBeInTheDocument();
        });
    });

    test("modal shows readonly note", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Junior Developer Learnership"));

        await waitFor(() => {
            expect(
                screen.getByText("🔒 Applications cannot be edited after submission.")
            ).toBeInTheDocument();
        });
    });

    test("card is keyboard accessible via Enter key", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        const card = screen.getByLabelText("View details for Junior Developer Learnership");
        fireEvent.keyDown(card, { key: "Enter" });

        await waitFor(() => {
            expect(screen.getByText("Application Progress")).toBeInTheDocument();
        });
    });
});

// ─── Notifications ────────────────────────────────────────────────────────────

describe("MyApplications — notifications", () => {

    test("writes notification when application status changes", async () => {
        const prevApps    = [{ id: "app1", title: "Junior Developer Learnership", company: "TechCorp", status: "Submitted", userId: "user123" }];
        const updatedApps = [{ id: "app1", title: "Junior Developer Learnership", company: "TechCorp", status: "Shortlisted", userId: "user123" }];

        let callCount = 0;
        onSnapshot.mockImplementation((q, successCallback) => {
            callCount++;
            if (callCount === 1) {
                successCallback({ docs: prevApps.map(a => ({ id: a.id, data: () => a })) });
            }
            return jest.fn();
        });

        render(<MyApplications />);

        await act(async () => {
            const snapshotCallback = onSnapshot.mock.calls[0][1];
            snapshotCallback({ docs: updatedApps.map(a => ({ id: a.id, data: () => a })) });
        });

        await waitFor(() => {
            expect(addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    userId:        "user123",
                    type:          "status_update",
                    title:         "Application Shortlisted",
                    applicationId: "app1",
                })
            );
        });
    });

    test("does not write notification on first load with no previous state", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        expect(addDoc).not.toHaveBeenCalled();
    });

    test("does not write notification when status has not changed", async () => {
        onSnapshot.mockImplementation((q, successCallback) => {
            successCallback({
                docs: mockApplications.map(a => ({ id: a.id, data: () => a })),
            });
            return jest.fn();
        });

        render(<MyApplications />);

        await act(async () => {
            const snapshotCallback = onSnapshot.mock.calls[0][1];
            // Same status — no change
            snapshotCallback({
                docs: mockApplications.map(a => ({ id: a.id, data: () => a })),
            });
        });

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        expect(addDoc).not.toHaveBeenCalled();
    });
});

// ─── ProgressTracker ──────────────────────────────────────────────────────────



describe("ProgressTracker", () => {

    function renderWithStatus(status) {
        onSnapshot.mockImplementation((q, successCallback) => {
            successCallback({
                docs: [{
                    id: "app1",
                    data: () => ({
                        id: "app1",
                        title: "Test App",
                        company: "TestCo",
                        status,
                        userId: "user123",
                    }),
                }],
            });
            return jest.fn();
        });

        return render(<MyApplications />);
    }

    const getTracker = async () => {
        const card = await screen.findByLabelText(
            "View details for Test App"
        );
        return card.querySelector(".progress-tracker");
    };

    test("shows Shortlisted label on Final Decision circle", async () => {
        renderWithStatus("Shortlisted");

        const tracker = await getTracker();
        const utils = within(tracker);

        expect(utils.getByText("Shortlisted")).toBeInTheDocument();
    });

    test("shows Accepted label on Final Decision circle", async () => {
        renderWithStatus("Accepted");

        const tracker = await getTracker();
        const utils = within(tracker);

        expect(utils.getByText("Accepted")).toBeInTheDocument();
    });

    test("shows Rejected label on Final Decision circle", async () => {
        renderWithStatus("Rejected");

        const tracker = await getTracker();
        const utils = within(tracker);

        expect(utils.getByText("Rejected")).toBeInTheDocument();
    });

    test("renders all four stage labels for a Submitted application", async () => {
        renderWithStatus("Submitted");

        const tracker = await getTracker();
        const utils = within(tracker);

        expect(utils.getByText("Submitted")).toBeInTheDocument();
        expect(utils.getByText("Received")).toBeInTheDocument();
        expect(utils.getByText("Under Evaluation")).toBeInTheDocument();
        expect(utils.getByText("Final Decision")).toBeInTheDocument();
    });

    test("renders progress tracker for each application", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            const submitted = screen.getAllByText("Submitted");
            expect(submitted.length).toBeGreaterThan(0);
        });
    });
});