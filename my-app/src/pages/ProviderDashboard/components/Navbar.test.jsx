import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "./Navbar";

describe("Navbar", () => {
  const mockLogout = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders the dashboard heading", () => {
    render(<Navbar providerName="" onLogout={mockLogout} />);
    expect(screen.getByRole("heading", { name: /provider dashboard/i })).toBeInTheDocument();
  });

  it("renders the provider's name when provided", () => {
    render(<Navbar providerName="Jane Smith" onLogout={mockLogout} />);
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("does not render a name element when providerName is empty", () => {
    render(<Navbar providerName="" onLogout={mockLogout} />);
    expect(screen.queryByLabelText(/logged in as/i)).not.toBeInTheDocument();
  });

  it("renders the logout button", () => {
    render(<Navbar providerName="Jane" onLogout={mockLogout} />);
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("calls onLogout when the logout button is clicked", () => {
    render(<Navbar providerName="Jane" onLogout={mockLogout} />);
    fireEvent.click(screen.getByRole("button", { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("renders a header landmark element", () => {
    render(<Navbar providerName="Jane" onLogout={mockLogout} />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });
});
