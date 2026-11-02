import React from "react";
import clsx from "clsx";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Optional caption shown below the spinner (e.g. "Verifying session…"). */
  label?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-[3px]",
};

export const Spinner: React.FC<SpinnerProps> = ({ size = "md", className, label }) => (
  <div className="flex flex-col items-center gap-3">
    <div
      role="status"
      aria-label={label ?? "Loading"}
      className={clsx(
        "border-peerity-800 border-t-transparent rounded-full animate-spin dark:border-teal-500 dark:border-t-transparent",
        SIZE_CLASSES[size],
        className
      )}
    />
    {label && <p className="text-xs font-medium text-slate-500 dark:text-slate-400 font-body">{label}</p>}
  </div>
);
