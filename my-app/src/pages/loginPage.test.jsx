import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SignupPage from "./signupPage";
import { MemoryRouter } from "react-router-dom";

// mocks
jest.mock("../components/signupApplicant", () => () => (
  <div>Applicant Form</div>
));

jest.mock("../components/signupProvider", () => () => (
  <div>Provider Form</div>
));

const renderPage = () =>
  render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>
  );

describe("SignupPage", () => {
  test("renders page heading and subtitle", () => {
    renderPage();

    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    expect(
      screen.getByText(/choose your role to get started/i)
    ).toBeInTheDocument();
  });

  test("renders applicant form by default", () => {
    renderPage();
    expect(screen.getByText("Applicant Form")).toBeInTheDocument();
  });

  test("switches to provider form when provider tab clicked", () => {
    renderPage();

    const providerTab = screen.getByRole("tab", { name: /provider/i });
    fireEvent.click(providerTab);

    expect(screen.getByText("Provider Form")).toBeInTheDocument();
  });

  test("switches back to applicant form when applicant tab clicked", () => {
    renderPage();

    fireEvent.click(screen.getByRole("tab", { name: /provider/i }));
    expect(screen.getByText("Provider Form")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /applicant/i }));
    expect(screen.getByText("Applicant Form")).toBeInTheDocument();
  });

  test("renders login link", () => {
    renderPage();

    const link = screen.getByRole("link", { name: /sign in/i });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });

  test("tabs render correctly", () => {
    renderPage();

    expect(
      screen.getByRole("tab", { name: /applicant/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("tab", { name: /provider/i })
    ).toBeInTheDocument();
  });
});