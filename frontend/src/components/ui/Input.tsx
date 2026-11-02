import React from "react";
import clsx from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

/**
 * Forwards its ref so it works as a drop-in with react-hook-form's register() — most forms in
 * this app don't use react-hook-form yet (see P2.1), but new/migrated ones should be able to.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    const errorId = inputId ? `${inputId}-error` : undefined;

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              "w-full py-2.5 pr-3 bg-slate-50 border rounded-lg text-sm text-slate-900 placeholder-slate-400 transition",
              "focus:outline-none focus:ring-2 focus:bg-white",
              "dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-800",
              leftIcon ? "pl-9" : "pl-3",
              error
                ? "border-red-400 focus:ring-red-400 dark:border-red-500"
                : "border-slate-300 focus:ring-peerity-600 dark:border-slate-700",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            {...rest}
          />
        </div>
        {error && (
          <p id={errorId} className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
