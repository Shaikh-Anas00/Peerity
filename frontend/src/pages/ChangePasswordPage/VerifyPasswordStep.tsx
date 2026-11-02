import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui";

export interface VerifyPasswordStepProps {
  verifying: boolean;
  onSubmit: (currentPassword: string) => void;
}

export const VerifyPasswordStep: React.FC<VerifyPasswordStepProps> = ({ verifying, onSubmit }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(currentPassword);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
          Step 1: Enter Current Password
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          To safeguard your account and cryptographic audit trail, please confirm your existing password before choosing a new one.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-display">
          Current Password <span className="text-rose-500 dark:text-rose-400">*</span>
        </label>
        <div className="relative max-w-md">
          <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type={showCurrentPassword ? "text" : "password"}
            required
            autoFocus
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200"
            title={showCurrentPassword ? "Hide password" : "Show password"}
          >
            {showCurrentPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <Link
          to="/settings"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition font-display"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Back to Settings
        </Link>

        <Button
          type="submit"
          variant="primary"
          disabled={!currentPassword}
          loading={verifying}
          leftIcon={<ArrowRight className="w-4 h-4" />}
        >
          {verifying ? "Verifying..." : "Verify & Proceed"}
        </Button>
      </div>
    </form>
  );
};
