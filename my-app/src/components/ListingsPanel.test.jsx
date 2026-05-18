import { render, screen } from "@testing-library/react";
import ListingsPanel from "./ListingsPanel";

describe("ListingsPanel", () => {

  test("renders main heading and description", () => {
    render(<ListingsPanel />);

    expect(screen.getByText(/my listings/i)).toBeInTheDocument();
    expect(
      screen.getByText(/manage all your posted opportunities/i)
    ).toBeInTheDocument();
  });

  test("renders all listings titles", () => {
    render(<ListingsPanel />);

    expect(screen.getByText("Software Internship")).toBeInTheDocument();
    expect(screen.getByText("Business Learnership")).toBeInTheDocument();
  });

  test("renders listing statuses", () => {
    render(<ListingsPanel />);

    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  test("renders correct number of listings", () => {
    render(<ListingsPanel />);

    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(2);
  });

  test("renders status badges with correct styling content", () => {
    render(<ListingsPanel />);

    const approved = screen.getByText("Approved");
    const pending = screen.getByText("Pending");

    expect(approved).toBeInTheDocument();
    expect(pending).toBeInTheDocument();

    // optional: ensures they are span elements
    expect(approved.tagName).toBe("SPAN");
    expect(pending.tagName).toBe("SPAN");
  });

});