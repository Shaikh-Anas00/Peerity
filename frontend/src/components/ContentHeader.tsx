import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, type LucideIcon } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export type StatusPillVariant =
  | "success"   // emerald: active, completed, verified
  | "warning"   // amber: pending, forming, review needed
  | "error"     // rose/red: rejected, dismissed, broken
  | "info"      // blue: under investigation, assigned
  | "brand"     // peerity teal: primary brand status
  | "purple"    // purple: committee, calibration
  | "neutral";  // slate: closed, archived, default

export interface StatusPillProps {
  label: string;
  variant?: StatusPillVariant;
  icon?: LucideIcon;
  className?: string;
}

const PILL_STYLES: Record<StatusPillVariant, string> = {
  success: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  warning: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  error:   "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  info:    "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  brand:   "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-teal-400 border-slate-200 dark:border-slate-700",
  purple:  "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  neutral: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

/**
 * Standard contextual status pill matching the "[ACTIVE GROUP]" reference pattern.
 */
export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = "brand",
  icon: Icon,
  className = "",
}) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider font-display flex-shrink-0 ${PILL_STYLES[variant]} ${className}`}
  >
    {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
    <span>{label}</span>
  </span>
);

export interface ContentHeaderProps {
  /**
   * Breadcrumb navigation on the left, matching "Team Alpha / Evaluate Member"
   */
  breadcrumbs: (string | BreadcrumbItem)[];

  /**
   * Primary title displayed prominently below the breadcrumb bar
   */
  title?: string;

  /**
   * Optional descriptive subtext under the title
   */
  subtitle?: React.ReactNode;

  /**
   * Optional icon rendered in a peerity-100 tile beside the title
   */
  icon?: LucideIcon;

  /**
   * Right-aligned contextual status pill (e.g. <StatusPill label="ACTIVE GROUP" variant="success" />)
   */
  statusPill?: React.ReactNode;

  /**
   * Right-aligned primary action button(s)
   */
  actions?: React.ReactNode;

  /**
   * If true, renders only the breadcrumb + status pill/actions bar (used in dense split panes)
   */
  compact?: boolean;

  /**
   * Additional wrapper class names
   */
  className?: string;
}

/**
 * Standard content header for all Peerity authenticated pages.
 *
 * Structure:
 * - Top breadcrumb line: "Parent / Child" on left, contextual status pill & primary actions on right.
 * - Title block (non-compact): Tile icon + Title + Subtitle.
 */
export const ContentHeader: React.FC<ContentHeaderProps> = ({
  breadcrumbs,
  title,
  subtitle,
  icon: Icon,
  statusPill,
  actions,
  compact = false,
  className = "",
}) => {
  return (
    <header className={`space-y-3 mb-6 font-body ${className}`}>
      {/* ── Top Bar: Breadcrumb on left; Status pill & actions on right ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-display">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const label = typeof item === "string" ? item : item.label;
            const href = typeof item === "object" ? item.href : undefined;
            const onClick = typeof item === "object" ? item.onClick : undefined;

            return (
              <React.Fragment key={`${index}-${label}`}>
                {index > 0 && (
                  <span className="text-slate-300 dark:text-slate-600 font-normal select-none" aria-hidden="true">
                    /
                  </span>
                )}
                {isLast ? (
                  <span
                    className="font-semibold text-slate-900 dark:text-slate-100 truncate"
                    aria-current="page"
                  >
                    {label}
                  </span>
                ) : href ? (
                  <Link
                    to={href}
                    className="font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors truncate"
                  >
                    {label}
                  </Link>
                ) : onClick ? (
                  <button
                    type="button"
                    onClick={onClick}
                    className="font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors truncate"
                  >
                    {label}
                  </button>
                ) : (
                  <span className="font-medium text-slate-500 dark:text-slate-400 truncate">{label}</span>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Right: Status pill and/or Actions */}
        {(statusPill || actions) && (
          <div className="flex items-center gap-2.5 ml-auto flex-wrap">
            {statusPill}
            {actions}
          </div>
        )}
      </div>

      {/* ── Title block (omitted in compact mode) ── */}
      {!compact && title && (
        <div className="flex items-start justify-between gap-4 pt-0.5">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-teal-400 flex-shrink-0 shadow-xs">
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display tracking-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-slate-500 dark:text-slate-400 font-body mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
