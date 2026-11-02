import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, Check, CheckCircle } from 'lucide-react';

const Requirement: React.FC<{ met: boolean; label: string }> = ({ met, label }) => (
  <div className="flex items-center gap-1.5">
    {met ? (
      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    ) : (
      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex-shrink-0" />
    )}
    <span className={met ? "text-emerald-700 dark:text-emerald-300 font-medium" : "text-slate-500 dark:text-slate-400"}>
      {label}
    </span>
  </div>
);

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isValid = hasMinLength && hasUppercase && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword, confirmPassword });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-peerity-800 dark:bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">Choose a new password</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Accountable, privacy-preserving peer evaluation</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          {!token ? (
            <div className="text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 dark:text-rose-400 mx-auto" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">Missing Reset Token</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                This link is missing its reset token. Please request a new password reset link.
              </p>
              <Link to="/forgot-password" className="inline-block text-xs font-semibold text-peerity-800 dark:text-teal-400 hover:underline mt-2">
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto border-2 border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">Password Updated</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-2 px-5 py-2 bg-peerity-800 hover:bg-peerity-600 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-peerity-600 dark:focus:ring-teal-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-peerity-600 dark:focus:ring-teal-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-700 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Requirements</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    <Requirement met={hasMinLength} label="At least 8 characters" />
                    <Requirement met={hasUppercase} label="One uppercase letter" />
                    <Requirement met={hasNumber} label="One number" />
                    <Requirement met={passwordsMatch} label="Passwords match" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !isValid}
                  className="w-full py-2.5 px-4 mt-2 bg-peerity-800 hover:bg-peerity-600 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting...</>
                    : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
