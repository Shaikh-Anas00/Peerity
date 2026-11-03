import React from "react";
import clsx from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

const PADDING_CLASSES: Record<string, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-8",
};

export const Card: React.FC<CardProps> = ({
  padding = "md",
  className,
  children,
  ...rest
}) => (
  <div
    className={clsx(
      "bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700 transition-all duration-200",
      PADDING_CLASSES[padding],
      className
    )}
    {...rest}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div
    className={clsx("pb-4 border-b border-slate-100 dark:border-slate-800", className)}
    {...rest}
  >
    {children}
  </div>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div className={clsx("pt-4", className)} {...rest}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div
    className={clsx(
      "pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2",
      className
    )}
    {...rest}
  >
    {children}
  </div>
);
