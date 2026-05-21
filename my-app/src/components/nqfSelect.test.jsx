import React, { useState } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { NqfDropdown, SectorDropdown } from "./nqfSelect";

// Mock Firebase
jest.mock("../firebase", () => ({ db: {} }));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  orderBy: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

describe("NqfDropdown", () => {
  test("renders placeholder text", () => {
    render(<NqfDropdown value="" onChange={jest.fn()} required={false} />);
    expect(screen.getByText("Select NQF level")).toBeInTheDocument();
  });

  test("opens when trigger is clicked", () => {
    render(<NqfDropdown value="" onChange={jest.fn()} required={false} />);
    fireEvent.click(screen.getByRole("button", { name: /select nqf level/i }));
    expect(screen.getByText("NQF 1")).toBeInTheDocument();
    expect(screen.getByText("NQF 10")).toBeInTheDocument();
  });

  test("calls onChange with selected qualification and NQF group", () => {
    const handleChange = jest.fn();
    render(<NqfDropdown value="" onChange={handleChange} required={false} />);
    fireEvent.click(screen.getByRole("button", { name: /select nqf level/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Diploma$/i }));
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: "Diploma (NQF 6)",
        }),
      })
    );
  });

  test("displays selected qualification after clicking it", () => {
    render(<NqfDropdown value="" onChange={jest.fn()} required={false} />);
    fireEvent.click(screen.getByRole("button", { name: /select nqf level/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Diploma$/i }));
    expect(screen.getByText("Diploma (NQF 6)")).toBeInTheDocument();
  });

  test("closes after selecting an option", () => {
    render(<NqfDropdown value="" onChange={jest.fn()} required={false} />);
    fireEvent.click(screen.getByRole("button", { name: /select nqf level/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Diploma$/i }));
    expect(screen.queryByText("NQF 1")).not.toBeInTheDocument();
  });

  test("hidden input receives required prop and value prop", () => {
    const { container } = render(
      <NqfDropdown value="Diploma (NQF 6)" onChange={jest.fn()} required />
    );
    const input = container.querySelector("input");
    expect(input).toBeRequired();
    expect(input).toHaveValue("Diploma (NQF 6)");
  });

  test("closes when clicking outside", () => {
    render(
      <div>
        <button type="button">Outside</button>
        <NqfDropdown value="" onChange={jest.fn()} required={false} />
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: /select nqf level/i }));
    expect(screen.getByText("NQF 1")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("button", { name: /outside/i }));
    expect(screen.queryByText("NQF 1")).not.toBeInTheDocument();
  });
});

describe("SectorDropdown", () => {
  test("renders placeholder text", () => {
    render(<SectorDropdown value="" onChange={jest.fn()} required={false} />);
    expect(screen.getByText("Select sector")).toBeInTheDocument();
  });

  test("opens when trigger is clicked", () => {
    render(<SectorDropdown value="" onChange={jest.fn()} required={false} />);
    fireEvent.click(screen.getByRole("button", { name: /select sector/i }));
    expect(
      screen.getByRole("button", {
        name: /^Agriculture and Nature Conservation$/i,
      })
    ).toBeInTheDocument();
  });

  test("calls onChange with selected sector", () => {
    const handleChange = jest.fn();
    render(
      <SectorDropdown value="" onChange={handleChange} required={false} />
    );
    fireEvent.click(screen.getByRole("button", { name: /select sector/i }));
    fireEvent.click(
      screen.getByRole("button", {
        name: /^Business, Commerce and Management Studies$/i,
      })
    );
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: "Business, Commerce and Management Studies",
        }),
      })
    );
  });

  test("displays sector from value prop", () => {
    render(
      <SectorDropdown
        value="Culture and Arts"
        onChange={jest.fn()}
        required={false}
      />
    );
    expect(screen.getByText("Culture and Arts")).toBeInTheDocument();
  });

  test("works as a controlled component", () => {
    function Wrapper() {
      const [sector, setSector] = useState("");
      return (
        <SectorDropdown
          value={sector}
          required={false}
          onChange={(e) => setSector(e.target.value)}
        />
      );
    }
    render(<Wrapper />);
    fireEvent.click(screen.getByRole("button", { name: /select sector/i }));
    fireEvent.click(
      screen.getByRole("button", {
        name: /^Education, Training and Development$/i,
      })
    );
    expect(
      screen.getByText("Education, Training and Development")
    ).toBeInTheDocument();
  });

  test("marks the selected sector option with selected class", () => {
    render(
      <SectorDropdown value="Culture and Arts" onChange={jest.fn()} required={false} />
    );
    fireEvent.click(screen.getByRole("button", { name: /culture and arts/i }));
    const list = screen.getByRole("list");
    const option = within(list).getByRole("button", {
      name: /^Culture and Arts$/i,
    });
    expect(option).toHaveClass("selected");
  });

  test("hidden input receives required prop and value prop", () => {
    const { container } = render(
      <SectorDropdown value="Culture and Arts" onChange={jest.fn()} required />
    );
    const input = container.querySelector("input");
    expect(input).toBeRequired();
    expect(input).toHaveValue("Culture and Arts");
  });

  test("closes after selecting a sector", () => {
    render(<SectorDropdown value="" onChange={jest.fn()} required={false} />);
    fireEvent.click(screen.getByRole("button", { name: /select sector/i }));
    fireEvent.click(
      screen.getByRole("button", {
        name: /^Business, Commerce and Management Studies$/i,
      })
    );
    expect(
      screen.queryByRole("button", {
        name: /^Agriculture and Nature Conservation$/i,
      })
    ).not.toBeInTheDocument();
  });

  test("closes when clicking outside", () => {
    render(
      <div>
        <button type="button">Outside</button>
        <SectorDropdown value="" onChange={jest.fn()} required={false} />
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: /select sector/i }));
    expect(
      screen.getByRole("button", {
        name: /^Agriculture and Nature Conservation$/i,
      })
    ).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("button", { name: /outside/i }));
    expect(
      screen.queryByRole("button", {
        name: /^Agriculture and Nature Conservation$/i,
      })
    ).not.toBeInTheDocument();
  });
});
