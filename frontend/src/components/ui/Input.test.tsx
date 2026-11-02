import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { Input } from "./Input";

describe("Input", () => {
  it("renders a label and associates it with the input", () => {
    render(<Input label="Email" name="email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toBeInTheDocument();
  });

  it("lets the user type into it", async () => {
    render(<Input label="Email" name="email" />);
    const input = screen.getByLabelText("Email");
    await userEvent.type(input, "jane@example.com");
    expect(input).toHaveValue("jane@example.com");
  });

  it("shows an error message and marks the input as invalid", () => {
    render(<Input label="Email" name="email" error="Email is required" />);
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("forwards its ref to the underlying <input> (react-hook-form compatibility)", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input label="Email" name="email" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("calls onChange handlers passed through via ...rest", async () => {
    const onChange = vi.fn();
    render(<Input label="Email" name="email" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Email"), "a");
    expect(onChange).toHaveBeenCalled();
  });
});
