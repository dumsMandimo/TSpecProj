import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";

describe("Sidebar", () => {
  const mockSetTab = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders all four navigation buttons", () => {
    render(<Sidebar setTab={mockSetTab} activeTab="overview" />);
    expect(screen.getByRole("button", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /my listings/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /applications/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /post opportunity/i })).toBeInTheDocument();
  });

  it("calls setTab with the correct key when a nav button is clicked", () => {
    render(<Sidebar setTab={mockSetTab} activeTab="overview" />);
    fireEvent.click(screen.getByRole("button", { name: /my listings/i }));
    expect(mockSetTab).toHaveBeenCalledWith("listings");
  });

  it("calls setTab with 'applications' when Applications is clicked", () => {
    render(<Sidebar setTab={mockSetTab} activeTab="overview" />);
    fireEvent.click(screen.getByRole("button", { name: /applications/i }));
    expect(mockSetTab).toHaveBeenCalledWith("applications");
  });

  it("calls setTab with 'create' when Post Opportunity is clicked", () => {
    render(<Sidebar setTab={mockSetTab} activeTab="overview" />);
    fireEvent.click(screen.getByRole("button", { name: /post opportunity/i }));
    expect(mockSetTab).toHaveBeenCalledWith("create");
  });

  it("marks the active tab button with aria-current='page'", () => {
    render(<Sidebar setTab={mockSetTab} activeTab="listings" />);
    const activeBtn = screen.getByRole("button", { name: /my listings/i });
    expect(activeBtn).toHaveAttribute("aria-current", "page");
  });

  it("does not mark inactive buttons with aria-current", () => {
    render(<Sidebar setTab={mockSetTab} activeTab="overview" />);
    const inactiveBtn = screen.getByRole("button", { name: /my listings/i });
    expect(inactiveBtn).not.toHaveAttribute("aria-current");
  });

  it("renders the brand name and portal label", () => {
    render(<Sidebar setTab={mockSetTab} activeTab="overview" />);
    expect(screen.getByText("UbuntuCareers")).toBeInTheDocument();
    expect(screen.getByText(/provider portal/i)).toBeInTheDocument();
  });

  it("renders a nav landmark with an accessible label", () => {
    render(<Sidebar setTab={mockSetTab} activeTab="overview" />);
    expect(screen.getByRole("navigation", { name: /provider navigation/i })).toBeInTheDocument();
  });
});
