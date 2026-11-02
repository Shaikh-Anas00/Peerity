import React, { useEffect } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const MAX_WIDTH_CLASSES: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

/** Matches the backdrop + panel pattern already used ad hoc for dialogs (e.g. GroupsManagePage). */
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, maxWidth = "lg" }) => {
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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 font-body"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full p-6 dark:border dark:border-slate-700",
          MAX_WIDTH_CLASSES[maxWidth]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
