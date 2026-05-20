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
import ListingsPanel from "./ListingsPanel";

jest.mock("./ListingsPanel.css", () => ({}), { virtual: true });

jest.mock("../../../services/providerService", () => ({
  subscribeToProviderListings: jest.fn(),
  updateOpportunity: jest.fn(),
  deleteOpportunity: jest.fn(),
  getApplicationCountsForListings: jest.fn(),
  autoCloseExpiredListings: jest.fn(),
}));

jest.mock("../../../services/firebase", () => ({
  auth: { currentUser: { uid: "provider-uid" } },
}));

import {
  subscribeToProviderListings,
  updateOpportunity,
  deleteOpportunity,
  getApplicationCountsForListings,
  autoCloseExpiredListings,
} from "../../../services/providerService";

const LISTINGS = [
  {
    id: "list-1",
    title: "React Internship",
    location: "Cape Town",
    type: "internship",
    status: "approved",
    closingDate: "2099-12-31",
    description: "Build cool React apps.",
  },
  {
    id: "list-2",
    title: "Java Learnership",
    location: "Johannesburg",
    type: "learnership",
    status: "pending",
    closingDate: "2099-12-31",
  },
  {
    id: "list-3",
    title: "QA Apprenticeship",
    location: "Durban",
    type: "apprenticeship",
    status: "closed",
    closingDate: "2000-01-01",
  },
];

function setupSubscription(listings = LISTINGS) {
  autoCloseExpiredListings.mockResolvedValue();

  getApplicationCountsForListings.mockResolvedValue({
    "list-1": 5,
    "list-2": 2,
    "list-3": 0,
  });

  subscribeToProviderListings.mockImplementation((uid, onData) => {
    onData(listings);
    return jest.fn();
  });
}

function getListingCard(title) {
  return screen.getByText(title).closest(".lc");
}

describe("ListingsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateOpportunity.mockResolvedValue({});
    deleteOpportunity.mockResolvedValue({});
  });

  it("renders listings", async () => {
    setupSubscription();
    render(<ListingsPanel />);

    await waitFor(() => {
      expect(screen.getByText("React Internship")).toBeInTheDocument();
    });
  });

  it("filters approved listings correctly", async () => {
    setupSubscription();
    render(<ListingsPanel />);

    await waitFor(() => screen.getByText("React Internship"));

    fireEvent.click(screen.getByRole("button", { name: /^approved/i }));

    expect(screen.getByText("React Internship")).toBeInTheDocument();
    expect(screen.queryByText("Java Learnership")).not.toBeInTheDocument();
  });

  it("filters pending listings correctly", async () => {
    setupSubscription();
    render(<ListingsPanel />);

    await waitFor(() => screen.getByText("Java Learnership"));

    fireEvent.click(screen.getByRole("button", { name: /^pending/i }));

    expect(screen.getByText("Java Learnership")).toBeInTheDocument();
    expect(screen.queryByText("React Internship")).not.toBeInTheDocument();
  });

  it("shows application counts", async () => {
    setupSubscription();
    render(<ListingsPanel />);

    await waitFor(() => {
      const outputs = screen.getAllByTitle(/applications received/i);
      expect(outputs.length).toBeGreaterThan(0);
    });
  });

  it("expands listing", async () => {
    setupSubscription();
    render(<ListingsPanel />);

    await waitFor(() => screen.getByText("React Internship"));

    fireEvent.click(screen.getByText("React Internship"));

    expect(screen.getByText(/build cool react apps/i)).toBeInTheDocument();
  });

  it("calls updateOpportunity safely", async () => {
    setupSubscription();
    render(<ListingsPanel />);

    await waitFor(() => screen.getByText("React Internship"));

    fireEvent.click(screen.getByText("React Internship"));

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    const titleInput = screen.getByDisplayValue("React Internship");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Vue Internship");

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateOpportunity).toHaveBeenCalledWith(
        "list-1",
        expect.objectContaining({ title: "Vue Internship" })
      );
    });
  });

  it("calls deleteOpportunity safely", async () => {
    setupSubscription();
    render(<ListingsPanel />);

    await waitFor(() => screen.getByText("React Internship"));

    fireEvent.click(screen.getByText("React Internship"));
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));

    await waitFor(() => {
      expect(deleteOpportunity).toHaveBeenCalledWith("list-1");
    });
  });

  it("shows empty state", async () => {
    setupSubscription([]);
    render(<ListingsPanel />);

    await waitFor(() => {
      expect(screen.getByText(/no.*listings/i)).toBeInTheDocument();
    });
  });

  it("calls autoCloseExpiredListings", async () => {
    setupSubscription();
    render(<ListingsPanel />);

    await waitFor(() => {
      expect(autoCloseExpiredListings).toHaveBeenCalled();
    });
  });
});