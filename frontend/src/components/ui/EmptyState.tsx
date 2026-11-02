import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-12 px-6">
    {icon && (
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">{title}</h3>
    {description && (
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
