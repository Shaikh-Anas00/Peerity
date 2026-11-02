import React from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui";

export interface SuccessStepProps {
  onDone: () => void;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({ onDone }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-12 shadow-xs text-center space-y-4 max-w-lg mx-auto">
    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto border-2 border-emerald-200 dark:border-emerald-800/50">
      <ShieldCheck className="w-8 h-8" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
      Password Updated Successfully
    </h3>
    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
      Your credentials have been securely updated. The password change has been recorded on the immutable audit ledger.
    </p>
    <div className="pt-4">
      <Button variant="primary" onClick={onDone}>
        Back to Settings
      </Button>
    </div>
  </div>
);
