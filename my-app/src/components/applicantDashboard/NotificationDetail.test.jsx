import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NotificationDetail from "./NotificationDetail";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

// Mock firebase
jest.mock("../../firebase", () => ({
    db: {},
}));

jest.mock("firebase/firestore", () => ({
    doc:    jest.fn(),
    getDoc: jest.fn(),
}));

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
    useParams:   jest.fn(),
    useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();

const mockNotifications = {
    status_update: {
        id:        "notif1",
        title:     "Application Shortlisted",
        body:      "Junior Developer Learnership: Great news! You have been shortlisted.",
        type:      "status_update",
        read:      true,
        createdAt: { toDate: () => new Date("2026-05-15T10:00:00") },
    },
    new_opportunity: {
        id:        "notif2",
        title:     "New opportunity available!",
        body:      "Data Analyst Internship at DataCo is now open for applications.",
        type:      "new_opportunity",
        read:      false,
        createdAt: { toDate: () => new Date("2026-05-15T09:00:00") },
    },
    closing_soon: {
        id:        "notif3",
        title:     "Opportunity closing soon!",
        body:      "Junior Developer Learnership closes in 3 days. Don't miss out!",
        type:      "closing_soon",
        read:      false,
        createdAt: { toDate: () => new Date("2026-05-15T08:00:00") },
    },
};

beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ notificationId: "notif1" });
    useNavigate.mockReturnValue(mockNavigate);
    doc.mockReturnValue("mockedDocRef");
});

describe("NotificationDetail", () => {

    test("shows loading state initially", () => {
        getDoc.mockImplementation(() => new Promise(() => {}));

        render(<NotificationDetail />);

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    test("shows not found message when notification does not exist", async () => {
        getDoc.mockResolvedValue({ exists: () => false });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("Notification not found.")).toBeInTheDocument();
        });
    });

    test("renders status update notification correctly", async () => {
        const notif = mockNotifications.status_update;
        getDoc.mockResolvedValue({
            exists: () => true,
            id:     notif.id,
            data:   () => notif,
        });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("Application Shortlisted")).toBeInTheDocument();
            expect(screen.getByText(/Great news! You have been shortlisted/)).toBeInTheDocument();
            expect(screen.getByText("Application Update")).toBeInTheDocument();
        });
    });

    test("renders new opportunity notification correctly", async () => {
        useParams.mockReturnValue({ notificationId: "notif2" });
        const notif = mockNotifications.new_opportunity;
        getDoc.mockResolvedValue({
            exists: () => true,
            id:     notif.id,
            data:   () => notif,
        });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("New opportunity available!")).toBeInTheDocument();
            expect(screen.getByText("New Opportunity")).toBeInTheDocument();
        });
    });

    test("renders closing soon notification correctly", async () => {
        useParams.mockReturnValue({ notificationId: "notif3" });
        const notif = mockNotifications.closing_soon;
        getDoc.mockResolvedValue({
            exists: () => true,
            id:     notif.id,
            data:   () => notif,
        });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("Opportunity closing soon!")).toBeInTheDocument();
            expect(screen.getByText("Closing Soon")).toBeInTheDocument();
        });
    });

    test("displays the received time", async () => {
        const notif = mockNotifications.status_update;
        getDoc.mockResolvedValue({
            exists: () => true,
            id:     notif.id,
            data:   () => notif,
        });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText(/Received:/)).toBeInTheDocument();
        });
    });

    test("back button navigates to previous page", async () => {
        const notif = mockNotifications.status_update;
        getDoc.mockResolvedValue({
            exists: () => true,
            id:     notif.id,
            data:   () => notif,
        });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("← Back")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("← Back"));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    test("view my applications button navigates to dashboard", async () => {
        const notif = mockNotifications.status_update;
        getDoc.mockResolvedValue({
            exists: () => true,
            id:     notif.id,
            data:   () => notif,
        });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("View My Applications")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("View My Applications"));
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/applicant");
    });

    test("go back button works from not found state", async () => {
        getDoc.mockResolvedValue({ exists: () => false });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("Go Back")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Go Back"));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
});