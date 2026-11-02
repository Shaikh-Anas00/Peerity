import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(
      <Modal open={false} onClose={vi.fn()}>
        Body
      </Modal>
    );
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
  });

  it("renders its children and title when open", () => {
    render(
      <Modal open onClose={vi.fn()} title="Confirm Action">
        Body content
      </Modal>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Confirm Action">
        Body
      </Modal>
    );
    // The backdrop is the dialog's direct parent element.
    const backdrop = screen.getByRole("dialog").parentElement;
    expect(backdrop).not.toBeNull();
    await userEvent.click(backdrop as HTMLElement);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when clicking inside the panel", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Confirm Action">
        Body content
      </Modal>
    );
    await userEvent.click(screen.getByText("Body content"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when the Escape key is pressed", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Confirm Action">
        Body
      </Modal>
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the header close button is clicked", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Confirm Action">
        Body
      </Modal>
    );
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
