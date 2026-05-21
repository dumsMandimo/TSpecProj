
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NotificationDetail from "./NotificationDetail";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("../../firebase", () => ({
    db: {},
}));

jest.mock("firebase/firestore", () => ({
    doc:       jest.fn(),
    getDoc:    jest.fn(),
    updateDoc: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
    useParams:   jest.fn(),
    useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockNotifications = {
    status_update: {
        id:            "notif1",
        title:         "Application Shortlisted",
        body:          "Junior Developer Learnership: Great news! You have been shortlisted.",
        type:          "status_update",
        read:          true,
        applicationId: "app123",
        createdAt:     { toDate: () => new Date("2026-05-15T10:00:00") },
    },
    status_update_unread: {
        id:            "notif1b",
        title:         "Application Received",
        body:          "Your application has been received.",
        type:          "status_update",
        read:          false,
        applicationId: "app123",
        createdAt:     { toDate: () => new Date("2026-05-15T10:00:00") },
    },
    new_opportunity: {
        id:            "notif2",
        title:         "New opportunity available!",
        body:          "Data Analyst Internship at DataCo is now open for applications.",
        type:          "new_opportunity",
        read:          false,
        opportunityId: "opp456",
        createdAt:     { toDate: () => new Date("2026-05-15T09:00:00") },
    },
    closing_soon: {
        id:            "notif3",
        title:         "Opportunity closing soon!",
        body:          "Junior Developer Learnership closes in 3 days. Don't miss out!",
        type:          "closing_soon",
        read:          false,
        opportunityId: "opp789",
        createdAt:     { toDate: () => new Date("2026-05-15T08:00:00") },
    },
    no_links: {
        id:        "notif4",
        title:     "General Notice",
        body:      "Something happened.",
        type:      "status_update",
        read:      true,
        createdAt: { toDate: () => new Date("2026-05-15T07:00:00") },
    },
};

beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ notificationId: "notif1" });
    useNavigate.mockReturnValue(mockNavigate);
    doc.mockReturnValue("mockedDocRef");
    updateDoc.mockResolvedValue();
});

// ─── Loading / not found ──────────────────────────────────────────────────────

describe("NotificationDetail — loading & not found", () => {

    test("shows loading state initially", () => {
        getDoc.mockImplementation(() => new Promise(() => {}));

        render(<NotificationDetail />);

        expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    test("shows not found message when notification does not exist", async () => {
        getDoc.mockResolvedValue({ exists: () => false });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("Notification not found.")).toBeInTheDocument();
        });
    });

    test("Go Back button works from not found state", async () => {
        getDoc.mockResolvedValue({ exists: () => false });

        render(<NotificationDetail />);

        await waitFor(() => { expect(screen.getByText("Go Back")).toBeInTheDocument(); });

        fireEvent.click(screen.getByText("Go Back"));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
});

// ─── Rendering by type ───────────────────────────────────────────────────────

describe("NotificationDetail — rendering", () => {

    test("renders status update notification correctly", async () => {
        const notif = mockNotifications.status_update;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

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
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("New opportunity available!")).toBeInTheDocument();
            expect(screen.getByText("New Opportunity")).toBeInTheDocument();
        });
    });

    test("renders closing soon notification correctly", async () => {
        useParams.mockReturnValue({ notificationId: "notif3" });
        const notif = mockNotifications.closing_soon;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("Opportunity closing soon!")).toBeInTheDocument();
            expect(screen.getByText("Closing Soon")).toBeInTheDocument();
        });
    });

    test("displays the received time", async () => {
        const notif = mockNotifications.status_update;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText(/Received:/)).toBeInTheDocument();
        });
    });
});

// ─── Mark as read ─────────────────────────────────────────────────────────────

describe("NotificationDetail — mark as read", () => {

    test("calls updateDoc to mark unread notification as read", async () => {
        const notif = mockNotifications.status_update_unread;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("Application Received")).toBeInTheDocument();
        });

        expect(updateDoc).toHaveBeenCalledWith(
            "mockedDocRef",
            { read: true }
        );
    });

    test("does not call updateDoc when notification is already read", async () => {
        const notif = mockNotifications.status_update;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("Application Shortlisted")).toBeInTheDocument();
        });

        expect(updateDoc).not.toHaveBeenCalled();
    });
});

// ─── Action buttons ───────────────────────────────────────────────────────────

describe("NotificationDetail — action buttons", () => {

    test("back button navigates to previous page", async () => {
        const notif = mockNotifications.status_update;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("← Back to Notifications")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("← Back to Notifications"));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    test("View Application button is shown when notification has applicationId", async () => {
        const notif = mockNotifications.status_update;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("📋 View Application")).toBeInTheDocument();
        });
    });

    test("View Application button navigates to the correct application route", async () => {
        const notif = mockNotifications.status_update;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => { expect(screen.getByText("📋 View Application")).toBeInTheDocument(); });

        fireEvent.click(screen.getByText("📋 View Application"));

        expect(mockNavigate).toHaveBeenCalledWith(
            `/dashboard/applicant/applications/${notif.applicationId}`
        );
    });

    test("View Opportunity button is shown for new_opportunity notification without applicationId", async () => {
        useParams.mockReturnValue({ notificationId: "notif2" });
        const notif = mockNotifications.new_opportunity;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("🔍 View Opportunity")).toBeInTheDocument();
        });
    });

    test("View Opportunity button navigates to dashboard with opportunityId query param", async () => {
        useParams.mockReturnValue({ notificationId: "notif2" });
        const notif = mockNotifications.new_opportunity;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => { expect(screen.getByText("🔍 View Opportunity")).toBeInTheDocument(); });

        fireEvent.click(screen.getByText("🔍 View Opportunity"));

        expect(mockNavigate).toHaveBeenCalledWith(
            `/dashboard/applicant?opportunityId=${notif.opportunityId}`
        );
    });

    test("View Opportunity button navigates correctly for closing_soon notification", async () => {
        useParams.mockReturnValue({ notificationId: "notif3" });
        const notif = mockNotifications.closing_soon;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => { expect(screen.getByText("🔍 View Opportunity")).toBeInTheDocument(); });

        fireEvent.click(screen.getByText("🔍 View Opportunity"));

        expect(mockNavigate).toHaveBeenCalledWith(
            `/dashboard/applicant?opportunityId=${notif.opportunityId}`
        );
    });

    test("View All My Applications button is always shown", async () => {
        const notif = mockNotifications.status_update;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => {
            expect(screen.getByText("View All My Applications")).toBeInTheDocument();
        });
    });

    test("View All My Applications button navigates to /dashboard/applicant/applications", async () => {
        const notif = mockNotifications.status_update;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => { expect(screen.getByText("View All My Applications")).toBeInTheDocument(); });

        fireEvent.click(screen.getByText("View All My Applications"));

        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/applicant/applications");
    });

    test("View Application button is not shown when there is no applicationId", async () => {
        const notif = mockNotifications.no_links;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => { expect(screen.getByText("General Notice")).toBeInTheDocument(); });

        expect(screen.queryByText("📋 View Application")).not.toBeInTheDocument();
    });

    test("View Opportunity button is not shown when there is an applicationId", async () => {
        const notif = mockNotifications.status_update;
        getDoc.mockResolvedValue({ exists: () => true, id: notif.id, data: () => notif });

        render(<NotificationDetail />);

        await waitFor(() => { expect(screen.getByText("Application Shortlisted")).toBeInTheDocument(); });

        expect(screen.queryByText("🔍 View Opportunity")).not.toBeInTheDocument();
    });
});
