import React from "react";
import clsx from "clsx";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "brand" | "default";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  default: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  danger: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  info: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  brand: "bg-peerity-100 text-peerity-900 border-peerity-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeTone;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ tone, variant = "neutral", icon, className, children, ...rest }) => {
  const activeTone = tone || variant;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
        TONE_CLASSES[activeTone] || TONE_CLASSES.neutral,
        className
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
};
