import React from "react";
import clsx from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md";
}

const PADDING_CLASSES: Record<string, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
};

export const Card: React.FC<CardProps> = ({ padding = "md", className, children, ...rest }) => (
  <div
    className={clsx(
      "bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700",
      PADDING_CLASSES[padding],
      className
    )}
    {...rest}
  >
    {children}
  </div>
);
