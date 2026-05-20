import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import OpportunityList from "./OpportunityList";
import { db, auth } from "../../firebase";
import {
    collection,
    getDocs,
    addDoc,
    query,
    where,
    Timestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

jest.mock("../../firebase", () => ({
    db:   {},
    auth: {},
}));

jest.mock("firebase/firestore", () => ({
    collection: jest.fn(),
    getDocs:    jest.fn(),
    addDoc:     jest.fn(),
    query:      jest.fn(),
    where:      jest.fn(),
    Timestamp:  { now: jest.fn(() => ({ seconds: 1234567890 })) },
}));

jest.mock("firebase/auth", () => ({
    onAuthStateChanged: jest.fn(),
}));

jest.mock("./OpportunityList.css", () => ({}));

const mockUser = { uid: "user123" };

const mockOpportunities = [
    {
        id:          "opp1",
        title:       "Junior Developer Learnership",
        description: "A great opportunity",
        location:    "Johannesburg",
        stipend:     "R5000/month",
        closingDate: "2026-12-31",
        company:     "TechCorp",
        status:      "approved",
    },
    {
        id:          "opp2",
        title:       "Data Analyst Internship",
        description: "Data focused role",
        location:    "Cape Town",
        stipend:     "R4000/month",
        closingDate: "2026-11-30",
        company:     "DataCo",
        status:      "approved",
    },
];

const mockApplications = [
    {
        id:            "app1",
        opportunityId: "opp1",
        userId:        "user123",
    },
];

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
});

describe("OpportunityList", () => {

    test("renders the opportunities section heading", async () => {
        getDocs.mockResolvedValue({ docs: [] });

        await act(async () => {
            render(<OpportunityList />);
        });

        expect(screen.getByText("Available Opportunities")).toBeInTheDocument();
    });

    test("renders opportunities fetched from Firestore", async () => {
        getDocs.mockResolvedValue({
            docs: mockOpportunities.map(opp => ({
                id:   opp.id,
                data: () => opp,
            })),
        });

        await act(async () => {
            render(<OpportunityList />);
        });

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });
    });

    test("shows empty message when no opportunities available", async () => {
        getDocs.mockResolvedValue({ docs: [] });

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
            // opportunities fetch
            .mockResolvedValueOnce({
                docs: mockOpportunities.map(opp => ({
                    id:   opp.id,
                    data: () => opp,
                })),
            })
            // applications fetch
            .mockResolvedValueOnce({
                docs: mockApplications.map(app => ({
                    id:   app.id,
                    data: () => app,
                })),
            });

        await act(async () => {
            render(<OpportunityList />);
        });

        await waitFor(() => {
            // opp2 not applied for — should show
            expect(screen.getByText("Data Analyst Internship")).toBeInTheDocument();
            // opp1 already applied for — should be filtered out
            expect(screen.queryByText("Junior Developer Learnership")).not.toBeInTheDocument();
        });
    });

    test("shows alert when user is not logged in and tries to apply", async () => {
        onAuthStateChanged.mockImplementation((auth, callback) => {
            callback(null);
            return jest.fn();
        });

        getDocs.mockResolvedValue({
            docs: mockOpportunities.map(opp => ({
                id:   opp.id,
                data: () => opp,
            })),
        });

        window.alert = jest.fn();

        await act(async () => {
            render(<OpportunityList />);
        });

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        fireEvent.click(screen.getAllByText("Apply Now")[0]);

        expect(window.alert).toHaveBeenCalledWith("Please log in first");
    });

    test("submits application and writes notification to Firestore", async () => {
        getDocs
            // opportunities
            .mockResolvedValueOnce({
                docs: mockOpportunities.map(opp => ({
                    id:   opp.id,
                    data: () => opp,
                })),
            })
            // applications — none yet
            .mockResolvedValueOnce({ docs: [] });

        window.alert = jest.fn();
        addDoc.mockResolvedValue({ id: "newApp123" });

        await act(async () => {
            render(<OpportunityList />);
        });

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        await act(async () => {
            fireEvent.click(screen.getAllByText("Apply Now")[0]);
        });

        await waitFor(() => {
            // addDoc called twice — once for application, once for notification
            expect(addDoc).toHaveBeenCalledTimes(2);
        });
    });

    test("shows alert when user already applied for an opportunity", async () => {
        // Both opportunities show in the list initially (no filter yet)
        getDocs
            // opportunities
            .mockResolvedValueOnce({
                docs: mockOpportunities.map(opp => ({
                    id:   opp.id,
                    data: () => opp,
                })),
            })
            // applications — none yet so both cards are visible
            .mockResolvedValueOnce({ docs: [] });

        window.alert = jest.fn();

        await act(async () => {
            render(<OpportunityList />);
        });

        await waitFor(() => {
            expect(screen.getByText("Junior Developer Learnership")).toBeInTheDocument();
        });

        // First click — applies successfully
        await act(async () => {
            fireEvent.click(screen.getAllByText("Apply Now")[0]);
        });

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith("Application submitted!");
        });

        // The button now reads "Applied" (disabled). fireEvent bypasses disabled in jsdom,
        // so clicking it still invokes handleApply which detects the sessionApplied duplicate.
        await act(async () => {
            fireEvent.click(screen.getAllByText("Applied")[0]);
        });

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(
                "You already applied for this opportunity"
            );
        });
    });

    test("renders opportunity details correctly", async () => {
        getDocs.mockResolvedValue({
            docs: [{ id: "opp1", data: () => mockOpportunities[0] }],
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
});