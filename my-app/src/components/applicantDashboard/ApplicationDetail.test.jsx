import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ApplicationDetail from "./ApplicationDetail";
import { getDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { within } from "@testing-library/react";

// ─── mocks ─────────────────────────────────────────────────────────────

jest.mock("react-router-dom", () => ({
    useParams: jest.fn(),
    useNavigate: jest.fn(),
}));

jest.mock("../../firebase", () => ({
    db: {},
}));

jest.mock("firebase/firestore", () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
}));

// ─── setup ─────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();

    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ applicationId: "app1" });
});

// ─── fixture ───────────────────────────────────────────────────────────

const baseApplication = {
    id: "app1",
    title: "Test App",
    company: "TestCo",
    status: "Submitted",
    appliedAt: {
        toDate: () => new Date("2026-05-01"),
    },
};

// ─── tests ─────────────────────────────────────────────────────────────

describe("ApplicationDetail", () => {

    test("shows loading state initially", () => {
        getDoc.mockReturnValue(new Promise(() => {}));
        render(<ApplicationDetail />);

        expect(screen.getByText("Loading…")).toBeInTheDocument();
    });

    test("renders application details", async () => {
        getDoc.mockResolvedValue({
            exists: () => true,
            id: "app1",
            data: () => baseApplication,
        });

        render(<ApplicationDetail />);

        await waitFor(() => {
            expect(screen.getByText("Test App")).toBeInTheDocument();
            expect(screen.getByText("TestCo")).toBeInTheDocument();
        });
    });

    test("renders status badge", async () => {
    getDoc.mockResolvedValue({
        exists: () => true,
        id: "app1",
        data: () => baseApplication,
    });

    render(<ApplicationDetail />);

    const badge = await screen.findByText("Submitted", {
        selector: ".app-modal-status-badge",
    });

    expect(badge).toBeInTheDocument();
});

    test("renders applied date", async () => {
        getDoc.mockResolvedValue({
            exists: () => true,
            id: "app1",
            data: () => baseApplication,
        });

        render(<ApplicationDetail />);

        await waitFor(() => {
            expect(screen.getByText(/Applied/i)).toBeInTheDocument();
        });
    });

    test("renders progress tracker stages", async () => {
        getDoc.mockResolvedValue({
            exists: () => true,
            id: "app1",
            data: () => baseApplication,
        });

        render(<ApplicationDetail />);

         const tracker = await screen.findByRole("list");
         const utils = within(tracker);


        await waitFor(() => {
        expect(utils.getByText("Submitted")).toBeInTheDocument();
        expect(utils.getByText("Received")).toBeInTheDocument();
        expect(utils.getByText("Under Evaluation")).toBeInTheDocument();
        expect(utils.getByText("Final Decision")).toBeInTheDocument();
    });
    });

    test("does NOT show received message for Submitted status", async () => {
    getDoc.mockResolvedValue({
        exists: () => true,
        id: "app1",
        data: () => baseApplication, // status = Submitted
    });

    render(<ApplicationDetail />);

    await waitFor(() => {
        expect(screen.getByText("Test App")).toBeInTheDocument();
    });

    expect(
        screen.queryByText(
            "Your application has been received and is under review."
        )
    ).not.toBeInTheDocument();
});

    test("handles Shortlisted status message", async () => {
        getDoc.mockResolvedValue({
            exists: () => true,
            id: "app1",
            data: () => ({ ...baseApplication, status: "Shortlisted" }),
        });

        render(<ApplicationDetail />);

        await waitFor(() => {
            expect(
                screen.getByText("Great news! You have been shortlisted.")
            ).toBeInTheDocument();
        });
    });

    test("handles Accepted status message", async () => {
        getDoc.mockResolvedValue({
            exists: () => true,
            id: "app1",
            data: () => ({ ...baseApplication, status: "Accepted" }),
        });

        render(<ApplicationDetail />);

        await waitFor(() => {
            expect(
                screen.getByText(
                    "Congratulations! Your application has been accepted."
                )
            ).toBeInTheDocument();
        });
    });

    test("handles Rejected status message", async () => {
        getDoc.mockResolvedValue({
            exists: () => true,
            id: "app1",
            data: () => ({ ...baseApplication, status: "Rejected" }),
        });

        render(<ApplicationDetail />);

        await waitFor(() => {
            expect(
                screen.getByText(
                    "Unfortunately your application was not successful this time."
                )
            ).toBeInTheDocument();
        });
    });

    test("navigates back when Go Back is clicked", async () => {
        getDoc.mockResolvedValue({
            exists: () => true,
            id: "app1",
            data: () => baseApplication,
        });

        render(<ApplicationDetail />);

        await waitFor(() => {
            expect(screen.getByText("Test App")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Go Back"));

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    test("shows not found state", async () => {
        getDoc.mockResolvedValue({
            exists: () => false,
        });

        render(<ApplicationDetail />);

        await waitFor(() => {
            expect(screen.getByText("Application not found.")).toBeInTheDocument();
        });
    });

    test("back button works on not found page", async () => {
        getDoc.mockResolvedValue({
            exists: () => false,
        });

        render(<ApplicationDetail />);

        await waitFor(() => {
            expect(screen.getByText("Application not found.")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Go Back"));

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
});