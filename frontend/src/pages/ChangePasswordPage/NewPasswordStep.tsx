import React, { useState } from "react";
import { KeyRound, Eye, EyeOff, ArrowLeft, Check, CheckCircle, Lock } from "lucide-react";
import { Button } from "../../components/ui";

export interface NewPasswordStepProps {
  updating: boolean;
  onBack: () => void;
  onSubmit: (newPassword: string, confirmPassword: string) => void;
}

const Requirement: React.FC<{ met: boolean; label: string }> = ({ met, label }) => (
  <div className="flex items-center gap-1.5">
    {met ? (
      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    ) : (
      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500" />
    )}
    <span className={met ? "text-emerald-700 dark:text-emerald-300 font-medium" : "text-slate-500 dark:text-slate-400"}>
      {label}
    </span>
  </div>
);

export const NewPasswordStep: React.FC<NewPasswordStepProps> = ({ updating, onBack, onSubmit }) => {
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit(newPassword, confirmPassword);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
            Step 2: Choose Your New Password
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your current password has been verified. Enter and confirm your new password below.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-xs font-bold font-display">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Old Password Verified
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-display">
            New Password <span className="text-rose-500 dark:text-rose-400">*</span>
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showNewPassword ? "text" : "password"}
              required
              autoFocus
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showNewPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-display">
            Confirm New Password <span className="text-rose-500 dark:text-rose-400">*</span>
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Complexity criteria Checklist */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/90 dark:border-slate-700 space-y-2.5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-display">
          Password Security Requirements
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          <Requirement met={hasMinLength} label="At least 8 characters" />
          <Requirement met={hasUppercase} label="One uppercase letter (A-Z)" />
          <Requirement met={hasLowercase} label="One lowercase letter (a-z)" />
          <Requirement met={hasNumber} label="One number (0-9)" />
          <Requirement met={hasSpecial} label="One special symbol (!@#$...)" />
          <Requirement met={passwordsMatch} label="Passwords match" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition font-display"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Step 1
        </button>

        <Button
          type="submit"
          variant="primary"
          disabled={!isValid}
          loading={updating}
          leftIcon={<Lock className="w-4 h-4" />}
        >
          {updating ? "Updating Password..." : "Save New Password"}
        </Button>
      </div>
    </form>
  );
};
