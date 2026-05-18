import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import OpportunityList from "./OpportunityList";

describe("OpportunityList", () => {
  test("renders the opportunities page heading and subtitle", () => {
    render(<OpportunityList />);

    expect(screen.getByText("Opportunities")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /available opportunities/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /find and apply for learnerships, internships and apprenticeships/i,
      ),
    ).toBeInTheDocument();
  });

  test("renders all available opportunity cards", () => {
    render(<OpportunityList />);

    expect(
      screen.getByRole("heading", {
        name: /software development internship/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: /data science learnership/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: /it support apprenticeship/i,
      }),
    ).toBeInTheDocument();
  });

  test("renders opportunity descriptions", () => {
    render(<OpportunityList />);

    expect(
      screen.getByText(/work with our dev team building web applications/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/learn data analysis and machine learning/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/gain hands-on it support experience/i),
    ).toBeInTheDocument();
  });

  test("renders opportunity locations", () => {
    render(<OpportunityList />);

    expect(screen.getByText(/johannesburg/i)).toBeInTheDocument();
    expect(screen.getByText(/cape town/i)).toBeInTheDocument();
    expect(screen.getByText(/pretoria/i)).toBeInTheDocument();
  });

  test("renders opportunity stipends", () => {
    render(<OpportunityList />);

    expect(screen.getByText(/r5000\/month/i)).toBeInTheDocument();
    expect(screen.getByText(/r4500\/month/i)).toBeInTheDocument();
    expect(screen.getByText(/r3500\/month/i)).toBeInTheDocument();
  });

  test("renders opportunity closing dates", () => {
    render(<OpportunityList />);

    expect(screen.getByText(/closes: 2026-05-01/i)).toBeInTheDocument();
    expect(screen.getByText(/closes: 2026-05-15/i)).toBeInTheDocument();
    expect(screen.getByText(/closes: 2026-06-01/i)).toBeInTheDocument();
  });

  test("renders one Apply Now button for each opportunity", () => {
    render(<OpportunityList />);

    const applyButtons = screen.getAllByRole("button", {
      name: /apply now/i,
    });

    expect(applyButtons).toHaveLength(3);
  });

  test("changes button text to Already Applied after clicking Apply Now", () => {
    render(<OpportunityList />);

    const applyButtons = screen.getAllByRole("button", {
      name: /apply now/i,
    });

    fireEvent.click(applyButtons[0]);

    expect(
      screen.getByRole("button", { name: /already applied/i }),
    ).toBeInTheDocument();
  });

  test("disables the button after applying", () => {
    render(<OpportunityList />);

    const applyButtons = screen.getAllByRole("button", {
      name: /apply now/i,
    });

    fireEvent.click(applyButtons[0]);

    const appliedButton = screen.getByRole("button", {
      name: /already applied/i,
    });

    expect(appliedButton).toBeDisabled();
  });

  test("only disables the selected opportunity after applying", () => {
    render(<OpportunityList />);

    const cards = screen.getAllByRole("article");

    const firstCardButton = within(cards[0]).getByRole("button", {
      name: /apply now/i,
    });

    fireEvent.click(firstCardButton);

    expect(
      within(cards[0]).getByRole("button", { name: /already applied/i }),
    ).toBeDisabled();

    expect(
      within(cards[1]).getByRole("button", { name: /apply now/i }),
    ).not.toBeDisabled();

    expect(
      within(cards[2]).getByRole("button", { name: /apply now/i }),
    ).not.toBeDisabled();
  });

  test("allows applying to multiple different opportunities", () => {
    render(<OpportunityList />);

    const cards = screen.getAllByRole("article");

    fireEvent.click(
      within(cards[0]).getByRole("button", { name: /apply now/i }),
    );

    fireEvent.click(
      within(cards[1]).getByRole("button", { name: /apply now/i }),
    );

    expect(
      within(cards[0]).getByRole("button", { name: /already applied/i }),
    ).toBeDisabled();

    expect(
      within(cards[1]).getByRole("button", { name: /already applied/i }),
    ).toBeDisabled();

    expect(
      within(cards[2]).getByRole("button", { name: /apply now/i }),
    ).not.toBeDisabled();
  });
});
