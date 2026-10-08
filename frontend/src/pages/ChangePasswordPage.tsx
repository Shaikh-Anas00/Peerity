import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userApi } from "../api/userApi";
import {
  KeyRound,
  Lock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
} from "lucide-react";
import { ContentHeader, StatusPill } from "../components/ContentHeader";

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard step: 1 = Verify Old Password, 2 = Enter New Password, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading & error states
  const [verifying, setVerifying] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation rules for new password
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isNewPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial && passwordsMatch;

  // Step 1: Verify old password
  const handleVerifyCurrentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    setError(null);
    setVerifying(true);
    try {
      await userApi.verifyPassword(currentPassword);
      setStep(2);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Current password is incorrect. Please check your credentials and try again."
      );
    } finally {
      setVerifying(false);
    }
  };

  // Step 2: Set new password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNewPasswordValid) {
      setError("Please satisfy all password complexity requirements before submitting.");
      return;
    }

    setError(null);
    setUpdating(true);
    try {
      await userApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setStep(3);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to update password. Please ensure all criteria are met."
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body space-y-6">
      {/* Header */}
      <ContentHeader
        breadcrumbs={[
          { label: "Account", href: "/profile" },
          { label: "General Settings", href: "/settings" },
          "Change Password",
        ]}
        title="Change Account Password"
        subtitle="Two-step authentication verification for updating your institutional login credentials."
        icon={KeyRound}
        statusPill={
          step === 3 ? (
            <StatusPill label="PASSWORD UPDATED" variant="success" icon={CheckCircle} />
          ) : step === 2 ? (
            <StatusPill label="STEP 2 OF 2" variant="brand" />
          ) : (
            <StatusPill label="STEP 1 OF 2" variant="warning" />
          )
        }
      />

      {/* Progress tracker */}
      {step !== 3 && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold font-display ${
              step === 1
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-teal-400 border border-slate-200 dark:border-slate-700"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
            }`}
          >
            {step > 1 ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-peerity-800 dark:bg-teal-600 text-white text-[10px] flex items-center justify-center">
                1
              </span>
            )}
            <span>Verify Old Password</span>
          </div>

          <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full" />

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold font-display ${
              step === 2
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-teal-400 border border-slate-200 dark:border-slate-700"
                : "bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                step === 2
                  ? "bg-peerity-800 dark:bg-teal-600 text-white"
                  : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              2
            </span>
            <span>Set New Password</span>
          </div>
        </div>
      )}

      {/* Error alert banner */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200 font-display">
              Verification Notice
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* ── STEP 1: VERIFY CURRENT PASSWORD ──────────────────────────── */}
      {step === 1 && (
        <form
          onSubmit={handleVerifyCurrentPassword}
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
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative max-w-md">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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

            <button
              type="submit"
              disabled={verifying || !currentPassword}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-peerity-800 hover:bg-peerity-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition shadow-xs font-display disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Proceed <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 2: ENTER NEW PASSWORD ───────────────────────────────── */}
      {step === 2 && (
        <form
          onSubmit={handleUpdatePassword}
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
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
              <div className="flex items-center gap-1.5">
                {hasMinLength ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400" />
                )}
                <span className={hasMinLength ? "text-emerald-700 dark:text-emerald-300 font-medium" : "text-slate-500 dark:text-slate-400"}>
                  At least 8 characters
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasUppercase ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400" />
                )}
                <span className={hasUppercase ? "text-emerald-700 dark:text-emerald-300 font-medium" : "text-slate-500 dark:text-slate-400"}>
                  One uppercase letter (A-Z)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasLowercase ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400" />
                )}
                <span className={hasLowercase ? "text-emerald-700 dark:text-emerald-300 font-medium" : "text-slate-500 dark:text-slate-400"}>
                  One lowercase letter (a-z)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasNumber ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400" />
                )}
                <span className={hasNumber ? "text-emerald-700 dark:text-emerald-300 font-medium" : "text-slate-500 dark:text-slate-400"}>
                  One number (0-9)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasSpecial ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400" />
                )}
                <span className={hasSpecial ? "text-emerald-700 dark:text-emerald-300 font-medium" : "text-slate-500 dark:text-slate-400"}>
                  One special symbol (!@#$...)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {passwordsMatch ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400" />
                )}
                <span className={passwordsMatch ? "text-emerald-700 dark:text-emerald-300 font-medium" : "text-slate-500 dark:text-slate-400"}>
                  Passwords match
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition font-display"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Step 1
            </button>

            <button
              type="submit"
              disabled={updating || !isNewPasswordValid}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-peerity-800 hover:bg-peerity-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition shadow-xs font-display disabled:opacity-50"
            >
              {updating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Save New Password
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 3: SUCCESS ───────────────────────────────────────────── */}
      {step === 3 && (
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
            <button
              onClick={() => navigate("/settings")}
              className="px-6 py-2.5 bg-peerity-800 hover:bg-peerity-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition shadow-sm font-display"
            >
              Back to Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangePasswordPage;
