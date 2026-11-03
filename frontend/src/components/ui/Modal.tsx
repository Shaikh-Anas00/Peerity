import React, { useEffect } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  maxWidthClass?: string;
}

const MAX_WIDTH_CLASSES: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

/** Matches the backdrop + panel pattern used for dialogs and modals across Peerity. */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "lg",
  maxWidthClass,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 font-body overflow-y-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full p-6 dark:border dark:border-slate-700 my-8",
          maxWidthClass || MAX_WIDTH_CLASSES[maxWidth]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">{title}</h2>
              {subtitle && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</div>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="space-y-4">{children}</div>
        {footer && <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">{footer}</div>}
      </div>
    </div>
  );
};
