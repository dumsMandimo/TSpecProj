import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Dashboard from "./Dashboard";

import {
  subscribeToOpportunities,
  subscribeToMyApplications,
} from "../../services/userService";

const mockNavigate = jest.fn();

const mockUnsubOpportunities = jest.fn();
const mockUnsubApplications = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("../../services/userService", () => ({
  subscribeToOpportunities: jest.fn(),
  subscribeToMyApplications: jest.fn(),
}));

jest.mock("./MyApplications", () => {
  return function MockMyApplications({ applications }) {
    return (
      <div data-testid="my-applications">
        Applications count: {applications.length}
      </div>
    );
  };
});

jest.mock("./OpportunityList", () => {
  return function MockOpportunityList({ opportunities }) {
    return (
      <div data-testid="opportunity-list">
        Opportunities count: {opportunities.length}
      </div>
    );
  };
});

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    subscribeToOpportunities.mockImplementation((onSuccess) => {
      onSuccess([
        {
          id: "opp1",
          title: "Software Developer Internship",
        },
        {
          id: "opp2",
          title: "Data Analyst Learnership",
        },
      ]);

      return mockUnsubOpportunities;
    });

    subscribeToMyApplications.mockImplementation((onSuccess) => {
      onSuccess([
        {
          id: "app1",
          status: "pending",
        },
      ]);

      return mockUnsubApplications;
    });
  });

  test("renders MyApplications component", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("my-applications")).toBeInTheDocument();
    });
  });

  test("renders OpportunityList component", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("opportunity-list")).toBeInTheDocument();
    });
  });

  test("passes applications data to MyApplications", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("my-applications")).toHaveTextContent(
        "Applications count: 1",
      );
    });
  });

  test("passes opportunities data to OpportunityList", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("opportunity-list")).toHaveTextContent(
        "Opportunities count: 2",
      );
    });
  });

  test("subscribes to opportunities and applications on mount", () => {
    render(<Dashboard />);

    expect(subscribeToOpportunities).toHaveBeenCalledTimes(1);
    expect(subscribeToMyApplications).toHaveBeenCalledTimes(1);
  });

  test("renders My Profile button", () => {
    render(<Dashboard />);

    expect(
      screen.getByRole("button", { name: /my profile/i }),
    ).toBeInTheDocument();
  });

  test("navigates to my profile page when My Profile button is clicked", () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByRole("button", { name: /my profile/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/myProfile");
  });

  test("unsubscribes from listeners on unmount", () => {
    const { unmount } = render(<Dashboard />);

    unmount();

    expect(mockUnsubOpportunities).toHaveBeenCalledTimes(1);
    expect(mockUnsubApplications).toHaveBeenCalledTimes(1);
  });

  test("logs opportunities subscription errors", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const error = new Error("Opportunities failed");

    subscribeToOpportunities.mockImplementation((_onSuccess, onError) => {
      onError(error);
      return mockUnsubOpportunities;
    });

    render(<Dashboard />);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Opportunities error:", error);

    consoleErrorSpy.mockRestore();
  });

  test("logs applications subscription errors", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const error = new Error("Applications failed");

    subscribeToMyApplications.mockImplementation((_onSuccess, onError) => {
      onError(error);
      return mockUnsubApplications;
    });

    render(<Dashboard />);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Applications error:", error);

    consoleErrorSpy.mockRestore();
  });
});
