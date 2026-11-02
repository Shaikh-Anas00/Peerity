import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../../api/userApi";
import { KeyRound, CheckCircle, AlertCircle } from "lucide-react";
import { ContentHeader, StatusPill } from "../../components/ContentHeader";
import { VerifyPasswordStep } from "./VerifyPasswordStep";
import { NewPasswordStep } from "./NewPasswordStep";
import { SuccessStep } from "./SuccessStep";

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard step: 1 = Verify Old Password, 2 = Enter New Password, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentPassword, setCurrentPassword] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyCurrentPassword = async (password: string) => {
    if (!password) {
      setError("Please enter your current password.");
      return;
    }

    setError(null);
    setVerifying(true);
    try {
      await userApi.verifyPassword(password);
      setCurrentPassword(password);
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

  const handleUpdatePassword = async (newPassword: string, confirmPassword: string) => {
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

      {step === 1 && <VerifyPasswordStep verifying={verifying} onSubmit={handleVerifyCurrentPassword} />}

      {step === 2 && (
        <NewPasswordStep
          updating={updating}
          onBack={() => {
            setError(null);
            setStep(1);
          }}
          onSubmit={handleUpdatePassword}
        />
      )}

      {step === 3 && <SuccessStep onDone={() => navigate("/settings")} />}
    </div>
  );
};

export default ChangePasswordPage;
