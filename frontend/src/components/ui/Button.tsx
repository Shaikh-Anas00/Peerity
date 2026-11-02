import React from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner in place of leftIcon and disables the button. */
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-peerity-800 hover:bg-peerity-600 text-white shadow-sm dark:bg-teal-600 dark:hover:bg-teal-500",
  secondary:
    "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700",
  danger:
    "bg-red-600 hover:bg-red-700 text-white shadow-sm dark:bg-red-600 dark:hover:bg-red-500",
  ghost:
    "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
};

/**
 * Single source of truth for button styling. Every page previously hand-wrote its own
 * Tailwind button classes, which had already drifted (rounded-lg vs rounded-xl, shadow-sm vs
 * shadow-2xs vs none, inconsistent dark: coverage) — see P1.6/P1.8 in the remediation plan.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  disabled,
  className,
  children,
  ...rest
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-semibold font-display transition disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className={clsx("animate-spin", size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
      ) : (
        leftIcon
      )}
      {children}
    </button>
  );
};
