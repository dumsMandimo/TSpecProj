import { render, screen } from "@testing-library/react";
import OverviewCards from "./OverviewCards";

describe("OverviewCards", () => {

  test("renders all stat labels", () => {
    render(<OverviewCards />);

    expect(screen.getByText("Listings")).toBeInTheDocument();
    expect(screen.getByText("Applications")).toBeInTheDocument();
    expect(screen.getByText("Shortlisted")).toBeInTheDocument();
    expect(screen.getByText("Accepted")).toBeInTheDocument();
  });

  test("renders all stat values correctly", () => {
    render(<OverviewCards />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("renders correct number of overview cards", () => {
    render(<OverviewCards />);

    const cards = screen.getAllByRole("article");
    expect(cards.length).toBe(4);
  });

  test("renders overview metric subtitle for each card", () => {
    render(<OverviewCards />);

    const subtitles = screen.getAllByText("Overview metric");
    expect(subtitles.length).toBe(4);
  });

  test("each stat label is inside document", () => {
    render(<OverviewCards />);

    const labels = ["Listings", "Applications", "Shortlisted", "Accepted"];

    labels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

});