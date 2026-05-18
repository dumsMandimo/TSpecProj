import { render, screen, waitFor, act } from "@testing-library/react";
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
    Timestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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

const mockUser = { uid: "user123" };

const mockApplications = [
    {
        id:      "app1",
        title:   "Junior Developer Learnership",
        company: "TechCorp",
        status:  "Submitted",
        userId:  "user123",
    },
    {
        id:      "app2",
        title:   "Data Analyst Internship",
        company: "DataCo",
        status:  "Shortlisted",
        userId:  "user123",
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

    onSnapshot.mockImplementation((q, successCallback, errorCallback) => {
        successCallback({
            docs: mockApplications.map(app => ({
                id:   app.id,
                data: () => app,
            })),
        });
        return jest.fn();
    });

    addDoc.mockResolvedValue({ id: "notif123" });
    query.mockReturnValue("mockedQuery");
    collection.mockReturnValue("mockedCollection");
    where.mockReturnValue("mockedWhere");
    doc.mockReturnValue("mockedDoc");
});

describe("MyApplications", () => {

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

    test("renders progress tracker for each application", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            // Both apps should show stage labels
            const submittedLabels = screen.getAllByText("Submitted");
            expect(submittedLabels.length).toBeGreaterThan(0);
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

    test("writes notification when application status changes", async () => {
        const prevApps = [{ id: "app1", title: "Junior Developer Learnership", company: "TechCorp", status: "Submitted", userId: "user123" }];
        const updatedApps = [{ id: "app1", title: "Junior Developer Learnership", company: "TechCorp", status: "Shortlisted", userId: "user123" }];

        let callCount = 0;
        onSnapshot.mockImplementation((q, successCallback) => {
            // First call returns prev, second returns updated
            callCount++;
            if (callCount === 1) {
                successCallback({
                    docs: prevApps.map(app => ({ id: app.id, data: () => app })),
                });
            }
            return jest.fn();
        });

        render(<MyApplications />);

        await act(async () => {
            // Simulate status change
            const snapshotCallback = onSnapshot.mock.calls[0][1];
            snapshotCallback({
                docs: updatedApps.map(app => ({ id: app.id, data: () => app })),
            });
        });

        await waitFor(() => {
            expect(addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    userId: "user123",
                    type:   "status_update",
                    title:  "Application Shortlisted",
                })
            );
        });
    });

    test("does not write notification on first load with no previous state", async () => {
        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        // addDoc should not be called on initial load since there is no prev state
        expect(addDoc).not.toHaveBeenCalled();
    });
});

describe("ProgressTracker", () => {

    test("shows Shortlisted label on Final Decision circle", async () => {
        onSnapshot.mockImplementation((q, successCallback) => {
            successCallback({
                docs: [
                    {
                        id:   "app1",
                        data: () => ({
                            id:      "app1",
                            title:   "Junior Developer Learnership",
                            company: "TechCorp",
                            status:  "Shortlisted",
                            userId:  "user123",
                        }),
                    },
                ],
            });
            return jest.fn();
        });

        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Shortlisted")).toBeInTheDocument();
        });
    });

    test("shows Accepted label on Final Decision circle", async () => {
        onSnapshot.mockImplementation((q, successCallback) => {
            successCallback({
                docs: [
                    {
                        id:   "app1",
                        data: () => ({
                            id:      "app1",
                            title:   "Junior Developer Learnership",
                            company: "TechCorp",
                            status:  "Accepted",
                            userId:  "user123",
                        }),
                    },
                ],
            });
            return jest.fn();
        });

        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Accepted")).toBeInTheDocument();
        });
    });

    test("shows Rejected label on Final Decision circle", async () => {
        onSnapshot.mockImplementation((q, successCallback) => {
            successCallback({
                docs: [
                    {
                        id:   "app1",
                        data: () => ({
                            id:      "app1",
                            title:   "Junior Developer Learnership",
                            company: "TechCorp",
                            status:  "Rejected",
                            userId:  "user123",
                        }),
                    },
                ],
            });
            return jest.fn();
        });

        render(<MyApplications />);

        await waitFor(() => {
            expect(screen.getByText("Rejected")).toBeInTheDocument();
        });
    });
});