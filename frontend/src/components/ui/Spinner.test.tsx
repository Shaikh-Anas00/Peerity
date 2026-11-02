import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("renders with an accessible status role", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("defaults to an aria-label of 'Loading'", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading");
  });

  it("uses a custom label as both the aria-label and the visible caption", () => {
    render(<Spinner label="Verifying session…" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Verifying session…");
    expect(screen.getByText("Verifying session…")).toBeInTheDocument();
  });

  it("applies the requested size classes", () => {
    render(<Spinner size="lg" />);
    expect(screen.getByRole("status")).toHaveClass("w-12", "h-12");
  });
});
