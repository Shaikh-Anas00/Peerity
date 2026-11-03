import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  msg: string;
  type: ToastType;
}

export interface ToastContextType {
  showToast: (msg: string, type?: ToastType, durationMs?: number) => void;
  toast: {
    success: (msg: string, durationMs?: number) => void;
    error: (msg: string, durationMs?: number) => void;
    info: (msg: string, durationMs?: number) => void;
    warning: (msg: string, durationMs?: number) => void;
  };
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS: Record<ToastType, React.FC<{ className?: string }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES: Record<ToastType, { border: string; bg: string; text: string; iconColor: string }> = {
  success: {
    border: "border-emerald-200 dark:border-emerald-800/80",
    bg: "bg-white dark:bg-slate-900",
    text: "text-slate-800 dark:text-slate-100",
    iconColor: "text-emerald-500 dark:text-emerald-400",
  },
  error: {
    border: "border-rose-200 dark:border-rose-800/80",
    bg: "bg-white dark:bg-slate-900",
    text: "text-slate-800 dark:text-slate-100",
    iconColor: "text-rose-500 dark:text-rose-400",
  },
  warning: {
    border: "border-amber-200 dark:border-amber-800/80",
    bg: "bg-white dark:bg-slate-900",
    text: "text-slate-800 dark:text-slate-100",
    iconColor: "text-amber-500 dark:text-amber-400",
  },
  info: {
    border: "border-sky-200 dark:border-sky-800/80",
    bg: "bg-white dark:bg-slate-900",
    text: "text-slate-800 dark:text-slate-100",
    iconColor: "text-sky-500 dark:text-sky-400",
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (msg: string, type: ToastType = "info", durationMs = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev, { id, msg, type }]);

      if (durationMs > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, durationMs);
      }
    },
    [dismissToast]
  );

  const toast = useMemo(
    () => ({
      success: (msg: string, durationMs?: number) => showToast(msg, "success", durationMs),
      error: (msg: string, durationMs?: number) => showToast(msg, "error", durationMs),
      info: (msg: string, durationMs?: number) => showToast(msg, "info", durationMs),
      warning: (msg: string, durationMs?: number) => showToast(msg, "warning", durationMs),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, toast, dismissToast }}>
      {children}

      {/* Floating Toast Container */}
      <aside
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map(({ id, msg, type }) => {
          const Icon = ICONS[type];
          const style = STYLES[type];

          return (
            <div
              key={id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-xs transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${style.bg} ${style.border}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-snug font-body ${style.text}`}>
                  {msg}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(id)}
                aria-label="Dismiss notification"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastProvider;
