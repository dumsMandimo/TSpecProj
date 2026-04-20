import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";

describe("Sidebar", () => {
  const mockSetTab = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders sidebar title", () => {
    render(<Sidebar setTab={mockSetTab} />);

    expect(screen.getByText("Provider")).toBeInTheDocument();
  });

  test("renders all navigation buttons", () => {
    render(<Sidebar setTab={mockSetTab} />);

    expect(screen.getByText("OVERVIEW")).toBeInTheDocument();
    expect(screen.getByText("LISTINGS")).toBeInTheDocument();
    expect(screen.getByText("APPLICATIONS")).toBeInTheDocument();
    expect(screen.getByText("CREATE")).toBeInTheDocument();
  });

  test("calls setTab when OVERVIEW is clicked", () => {
    render(<Sidebar setTab={mockSetTab} />);

    fireEvent.click(screen.getByText("OVERVIEW"));
    expect(mockSetTab).toHaveBeenCalledWith("overview");
  });

  test("calls setTab when LISTINGS is clicked", () => {
    render(<Sidebar setTab={mockSetTab} />);

    fireEvent.click(screen.getByText("LISTINGS"));
    expect(mockSetTab).toHaveBeenCalledWith("listings");
  });

  test("calls setTab when APPLICATIONS is clicked", () => {
    render(<Sidebar setTab={mockSetTab} />);

    fireEvent.click(screen.getByText("APPLICATIONS"));
    expect(mockSetTab).toHaveBeenCalledWith("applications");
  });

  test("calls setTab when CREATE is clicked", () => {
    render(<Sidebar setTab={mockSetTab} />);

    fireEvent.click(screen.getByText("CREATE"));
    expect(mockSetTab).toHaveBeenCalledWith("create");
  });

  test("all buttons are rendered as clickable elements", () => {
    render(<Sidebar setTab={mockSetTab} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(4);
  });
});