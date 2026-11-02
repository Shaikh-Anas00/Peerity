import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its children text", () => {
    render(<Badge>ACTIVE</Badge>);
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("defaults to the neutral tone", () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText("Default")).toHaveClass("bg-slate-100");
  });

  it("applies the requested tone's classes", () => {
    render(<Badge tone="success">Approved</Badge>);
    expect(screen.getByText("Approved")).toHaveClass("bg-emerald-50");
  });

  it("renders an icon alongside the label when provided", () => {
    render(<Badge icon={<span data-testid="badge-icon" />}>With Icon</Badge>);
    expect(screen.getByTestId("badge-icon")).toBeInTheDocument();
  });
});
