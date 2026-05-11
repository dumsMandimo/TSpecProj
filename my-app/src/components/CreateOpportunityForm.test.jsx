import { render, screen } from "@testing-library/react";
import CreateOpportunityForm from "./CreateOpportunityForm";

describe("CreateOpportunityForm", () => {

  test("renders form heading", () => {
    render(<CreateOpportunityForm />);

    expect(
      screen.getByRole("heading", { name: /post new opportunity/i })
    ).toBeInTheDocument();
  });

  test("renders all input fields", () => {
    render(<CreateOpportunityForm />);

    expect(screen.getByPlaceholderText("Title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Location")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Stipend")).toBeInTheDocument();
  });

  test("renders description textarea", () => {
    render(<CreateOpportunityForm />);

    expect(screen.getByPlaceholderText("Description")).toBeInTheDocument();
  });

  test("renders submit button", () => {
    render(<CreateOpportunityForm />);

    expect(screen.getByRole("button", { name: /post/i })).toBeInTheDocument();
  });

  test("form contains correct number of inputs", () => {
    render(<CreateOpportunityForm />);

    const textInputs = screen.getAllByRole("textbox");
    expect(textInputs.length).toBe(4); 
    // 3 inputs + 1 textarea
  });

});