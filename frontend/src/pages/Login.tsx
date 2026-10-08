import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, AlertCircle, UserCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { label: 'Student', email: 'student1@peerity.edu', password: 'Student@12345', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' },
  { label: 'Instructor', email: 'instructor1@peerity.edu', password: 'Instructor@12345', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' },
  { label: 'Committee', email: 'committee1@peerity.edu', password: 'Committee@12345', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' },
  { label: 'Admin', email: 'admin@peerity.edu', password: 'Admin@12345', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' },
];

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'student1@peerity.edu', password: 'Student@12345' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        {/* Back navigation */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-peerity-800 hover:text-peerity-600 transition"
          >
            &larr; Back to Peerity Home
          </Link>
        </div>

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-peerity-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Sign in to Peerity</h1>
          <p className="text-sm text-slate-500 mt-1.5">Accountable, privacy-preserving peer evaluation</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {serverError && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@university.edu"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-peerity-600 focus:bg-white transition"
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-peerity-600 focus:bg-white transition"
                />
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 mt-2 bg-peerity-800 hover:bg-peerity-600 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
                : 'Sign In'}
            </button>
          </form>

          {/* Demo quick-select */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Demo accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => { setValue('email', acc.email); setValue('password', acc.password); }}
                  className={`p-2.5 text-left rounded-lg border text-xs font-medium transition ${acc.color}`}
                >
                  <div className="flex items-center gap-1.5">
                    <UserCircle className="w-3.5 h-3.5 opacity-60" />
                    {acc.label}
                  </div>
                  <div className="text-[10px] opacity-60 mt-0.5 truncate">{acc.email.split('@')[0]}@…</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          No account?{' '}
          <Link to="/register" className="font-semibold text-peerity-800 hover:text-peerity-600 hover:underline">
            Register as a student
          </Link>
        </p>
      </div>
    </div>
  );
};
