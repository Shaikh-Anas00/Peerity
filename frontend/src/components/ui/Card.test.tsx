import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./Card";

describe("Card", () => {
  it("renders its children", () => {
    render(<Card>Content</Card>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("defaults to medium padding", () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId("card")).toHaveClass("p-5");
  });

  it("applies no padding classes when padding='none'", () => {
    render(
      <Card data-testid="card" padding="none">
        Content
      </Card>
    );
    const card = screen.getByTestId("card");
    expect(card).not.toHaveClass("p-5");
    expect(card).not.toHaveClass("p-4");
  });

  it("merges a custom className alongside its own", () => {
    render(
      <Card data-testid="card" className="custom-class">
        Content
      </Card>
    );
    expect(screen.getByTestId("card")).toHaveClass("custom-class");
    expect(screen.getByTestId("card")).toHaveClass("rounded-xl");
  });
});
