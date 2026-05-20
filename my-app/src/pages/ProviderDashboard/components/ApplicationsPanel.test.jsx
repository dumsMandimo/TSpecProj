import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ApplicationsPanel from "./ApplicationsPanel";

jest.mock("./ApplicationsPanel.css", () => ({}), { virtual: true });

jest.mock("../../../services/providerService", () => ({
  subscribeToProviderApplications: jest.fn(),
  updateApplicationStatus: jest.fn(),
}));

jest.mock("../../../services/firebase", () => ({
  auth: { currentUser: { uid: "provider-uid" } },
}));

import {
  subscribeToProviderApplications,
  updateApplicationStatus,
} from "../../../services/providerService";

const APPS = [
  {
    id: "app-1",
    applicantName: "Alice Smith",
    applicantEmail: "alice@example.com",
    applicantPhone: "0821234567",
    opportunityTitle: "React Internship",
    status: "submitted",
    cvUrl: "https://example.com/cv1.pdf",
    education: "BSc Computer Science",
    skills: "React, Node.js",
    interests: "Web development",
  },
  {
    id: "app-2",
    applicantName: "Bob Jones",
    opportunityTitle: "Java Learnership",
    status: "shortlisted",
  },
  {
    id: "app-3",
    applicantName: "Carol White",
    opportunityTitle: "React Internship",
    status: "accepted",
  },
  {
    id: "app-4",
    applicantName: "Dave Brown",
    opportunityTitle: "QA Learnership",
    status: "rejected",
  },
];

function setupSubscription(apps = APPS) {
  subscribeToProviderApplications.mockImplementation((uid, onData) => {
    onData(apps);
    return jest.fn();
  });
}

function getCard(name) {
  return screen.getByText(name).closest(".ac");
}

describe("ApplicationsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateApplicationStatus.mockResolvedValue({});
  });

  it("renders applications", () => {
    setupSubscription();
    render(<ApplicationsPanel />);

    APPS.forEach((a) => {
      expect(screen.getByText(a.applicantName)).toBeInTheDocument();
    });
  });

  it("filters accepted applications correctly", () => {
    setupSubscription();
    render(<ApplicationsPanel />);

    const acceptedFilter = screen.getByRole("button", { name: /accepted/i });
    fireEvent.click(acceptedFilter);

    expect(screen.getByText("Carol White")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  it("filters rejected applications correctly", () => {
    setupSubscription();
    render(<ApplicationsPanel />);

    const rejectedFilter = screen.getByRole("button", { name: /rejected/i });
    fireEvent.click(rejectedFilter);

    expect(screen.getByText("Dave Brown")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  it("shows no results state", () => {
    setupSubscription(APPS);
    render(<ApplicationsPanel />);

    const search = screen.getByRole("searchbox");
    fireEvent.change(search, { target: { value: "zzznoresult" } });

    expect(screen.getByText(/no applications found/i)).toBeInTheDocument();
  });

  it("expands application", () => {
    setupSubscription();
    render(<ApplicationsPanel />);

    fireEvent.click(screen.getByText("Alice Smith"));

    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("calls updateApplicationStatus safely", async () => {
    setupSubscription();
    render(<ApplicationsPanel />);

    fireEvent.click(screen.getByText("Alice Smith"));

    const card = getCard("Alice Smith");

    const acceptBtn = within(card).getByRole("button", {
      name: /accept/i,
    });

    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(updateApplicationStatus).toHaveBeenCalledWith(
        "app-1",
        "accepted"
      );
    });
  });

  it("shows empty state", () => {
    setupSubscription([]);
    render(<ApplicationsPanel />);

    expect(
      screen.getByText(/no applications found/i)
    ).toBeInTheDocument();
  });
});