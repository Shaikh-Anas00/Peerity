import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { ShieldCheck, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      // Always show the same generic confirmation, whether or not the email is registered —
      // the backend deliberately gives no signal either way (avoids account enumeration).
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs font-semibold text-peerity-800 dark:text-teal-400 hover:text-peerity-600 dark:hover:text-teal-300 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-peerity-800 dark:bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">Reset your password</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Enter your account email and we'll send you a reset link
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          {submitted ? (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto border-2 border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">Check your inbox</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                If an account exists for <span className="font-semibold">{email}</span>, a password reset link has
                been sent. The link expires in 30 minutes.
              </p>
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@university.edu"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-peerity-600 dark:focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-800 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 mt-2 bg-peerity-800 hover:bg-peerity-600 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                    : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
