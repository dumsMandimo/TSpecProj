import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NotificationBell from "./NotificationBell";
import { db, auth } from "../../firebase";
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    orderBy,
    writeBatch
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
    onSnapshot: jest.fn(),
    doc:        jest.fn(),
    updateDoc:  jest.fn(),
    orderBy:    jest.fn(),
    writeBatch: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
    onAuthStateChanged: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
    useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();

const mockNotifications = [
    {
        id:        "notif1",
        title:     "Application Shortlisted",
        body:      "Junior Developer Learnership: Great news! You have been shortlisted.",
        type:      "status_update",
        read:      false,
        createdAt: { toDate: () => new Date("2026-05-15T10:00:00") },
    },
    {
        id:        "notif2",
        title:     "New opportunity available!",
        body:      "Data Analyst Internship at DataCo is now open.",
        type:      "new_opportunity",
        read:      true,
        createdAt: { toDate: () => new Date("2026-05-14T09:00:00") },
    },
    {
        id:        "notif3",
        title:     "Opportunity closing soon!",
        body:      "Junior Developer Learnership closes in 3 days.",
        type:      "closing_soon",
        read:      false,
        createdAt: { toDate: () => new Date("2026-05-13T08:00:00") },
    },
];

beforeEach(() => {
    jest.clearAllMocks();

    useNavigate.mockReturnValue(mockNavigate);

    onAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ uid: "user123" });
        return jest.fn();
    });

    onSnapshot.mockImplementation((q, successCallback, errorCallback) => {
        successCallback({
            docs: mockNotifications.map(n => ({
                id:   n.id,
                data: () => n,
            })),
        });
        return jest.fn();
    });

    updateDoc.mockResolvedValue();
    writeBatch.mockReturnValue({
        update:  jest.fn(),
        commit:  jest.fn().mockResolvedValue(),
    });

    query.mockReturnValue("mockedQuery");
    collection.mockReturnValue("mockedCollection");
    where.mockReturnValue("mockedWhere");
    orderBy.mockReturnValue("mockedOrderBy");
    doc.mockReturnValue("mockedDoc");
});

describe("NotificationBell", () => {

    test("renders the bell button", () => {
        render(<NotificationBell />);
        expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
    });

    test("shows unread count badge when there are unread notifications", async () => {
        render(<NotificationBell />);

        await waitFor(() => {
            // 2 unread notifications (notif1 and notif3)
            expect(screen.getByText("2")).toBeInTheDocument();
        });
    });

    test("does not show badge when all notifications are read", async () => {
        onSnapshot.mockImplementation((q, successCallback) => {
            successCallback({
                docs: mockNotifications
                    .map(n => ({ ...n, read: true }))
                    .map(n => ({ id: n.id, data: () => n })),
            });
            return jest.fn();
        });

        render(<NotificationBell />);

        await waitFor(() => {
            expect(screen.queryByText("2")).not.toBeInTheDocument();
        });
    });

    test("opens dropdown when bell is clicked", async () => {
        render(<NotificationBell />);

        fireEvent.click(screen.getByLabelText("Notifications"));

        await waitFor(() => {
            // Header renders "Notifications" as text with the count in a sibling <mark>
            expect(screen.getByText(/^Notifications/)).toBeInTheDocument();
            // The inline badge inside the header shows the unread count
            const marks = screen.getAllByText("2");
            expect(marks.length).toBeGreaterThan(0);
        });
    });

    test("shows all notifications in dropdown", async () => {
        render(<NotificationBell />);

        fireEvent.click(screen.getByLabelText("Notifications"));

        await waitFor(() => {
            expect(screen.getByText("Application Shortlisted")).toBeInTheDocument();
            expect(screen.getByText("New opportunity available!")).toBeInTheDocument();
            expect(screen.getByText("Opportunity closing soon!")).toBeInTheDocument();
        });
    });

    test("shows empty message when there are no notifications", async () => {
        onSnapshot.mockImplementation((q, successCallback) => {
            successCallback({ docs: [] });
            return jest.fn();
        });

        render(<NotificationBell />);

        fireEvent.click(screen.getByLabelText("Notifications"));

        await waitFor(() => {
            expect(screen.getByText("No notifications yet")).toBeInTheDocument();
        });
    });

    test("marks notification as read and navigates on click", async () => {
        render(<NotificationBell />);

        fireEvent.click(screen.getByLabelText("Notifications"));

        await waitFor(() => {
            expect(screen.getByText("Application Shortlisted")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Application Shortlisted"));

        await waitFor(() => {
            expect(updateDoc).toHaveBeenCalledWith(
                "mockedDoc",
                { read: true }
            );
            expect(mockNavigate).toHaveBeenCalledWith(
                "/dashboard/applicant/notifications/notif1"
            );
        });
    });

    test("mark all read button calls writeBatch", async () => {
        const mockBatch = {
            update: jest.fn(),
            commit: jest.fn().mockResolvedValue(),
        };
        writeBatch.mockReturnValue(mockBatch);

        render(<NotificationBell />);

        fireEvent.click(screen.getByLabelText("Notifications"));

        await waitFor(() => {
            expect(screen.getByText("Mark all read")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Mark all read"));

        await waitFor(() => {
            expect(mockBatch.commit).toHaveBeenCalled();
        });
    });

    test("closes dropdown when clicking outside", async () => {
        render(<NotificationBell />);

        fireEvent.click(screen.getByLabelText("Notifications"));

        await waitFor(() => {
            // Dropdown is open — header and notification list are visible
            expect(screen.getByText("Application Shortlisted")).toBeInTheDocument();
        });

        fireEvent.mouseDown(document.body);

        await waitFor(() => {
            expect(screen.queryByText("Application Shortlisted")).not.toBeInTheDocument();
        });
    });

    test("clears notifications when user is not logged in", async () => {
        onAuthStateChanged.mockImplementation((auth, callback) => {
            callback(null);
            return jest.fn();
        });

        render(<NotificationBell />);

        fireEvent.click(screen.getByLabelText("Notifications"));

        await waitFor(() => {
            expect(screen.getByText("No notifications yet")).toBeInTheDocument();
        });
    });

    test("shows 9+ when unread count exceeds 9", async () => {
        const manyUnread = Array.from({ length: 10 }, (_, i) => ({
            id:        `notif${i}`,
            title:     `Notification ${i}`,
            body:      "Some body",
            type:      "status_update",
            read:      false,
            createdAt: { toDate: () => new Date() },
        }));

        onSnapshot.mockImplementation((q, successCallback) => {
            successCallback({
                docs: manyUnread.map(n => ({ id: n.id, data: () => n })),
            });
            return jest.fn();
        });

        render(<NotificationBell />);

        await waitFor(() => {
            expect(screen.getByText("9+")).toBeInTheDocument();
        });
    });

    test("displays notification timestamp", async () => {
        render(<NotificationBell />);

        fireEvent.click(screen.getByLabelText("Notifications"));

        await waitFor(() => {
            expect(screen.getByText("Application Shortlisted")).toBeInTheDocument();
            // time element should be present
            const timeElements = document.querySelectorAll("time");
            expect(timeElements.length).toBeGreaterThan(0);
        });
    });
});