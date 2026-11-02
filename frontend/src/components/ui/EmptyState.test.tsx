import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the required title", () => {
    render(<EmptyState title="No results found" />);
    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("renders the optional description when provided", () => {
    render(<EmptyState title="No results found" description="Try a different filter." />);
    expect(screen.getByText("Try a different filter.")).toBeInTheDocument();
  });

  it("does not render a description when omitted", () => {
    render(<EmptyState title="No results found" />);
    expect(screen.queryByText(/try a different/i)).not.toBeInTheDocument();
  });

  it("renders the optional icon and action when provided", () => {
    render(
      <EmptyState
        title="No results found"
        icon={<span data-testid="empty-icon" />}
        action={<button>Retry</button>}
      />
    );
    expect(screen.getByTestId("empty-icon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
