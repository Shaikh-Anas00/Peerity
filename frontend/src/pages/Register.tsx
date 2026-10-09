import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, User as UserIcon, Building, BookOpen, AlertCircle, Info, Eye, EyeOff } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  role: z.literal('STUDENT').default('STUDENT'),
  institution: z.string().min(2, 'Institution is required'),
  department: z.string().min(2, 'Department is required'),
  consentAgreed: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the anonymous review and quorum governance policy to register' }),
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: registerUser, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'STUDENT', institution: '', department: '' },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await registerUser(data);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-peerity-600 focus:bg-white transition";
  const labelCls = "block text-xs font-semibold text-slate-700 mb-1.5";
  const iconCls = "w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8 bg-slate-50">
      <div className="w-full max-w-lg">
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
          <h1 className="text-2xl font-bold text-slate-900 font-display">Create your Peerity account</h1>
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
            {/* Full Name */}
            <div>
              <label className={labelCls}>
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className={iconCls} />
                <input {...register('fullName')} type="text" placeholder="Jane Doe" className={inputCls} />
              </div>
              {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className={labelCls}>
                Email address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className={iconCls} />
                <input {...register('email')} type="email" placeholder="jane.doe@university.edu" className={inputCls} />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className={labelCls}>
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className={iconCls} />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-peerity-600 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md transition"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            {/* Role (locked) + Department */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Account Role</label>
                <input
                  type="text"
                  value="Student"
                  disabled
                  className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  Public registration is student-only. Staff roles are admin-provisioned.
                </p>
              </div>
              <div>
                <label className={labelCls}>
                  Department <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <BookOpen className={iconCls} />
                  <input {...register('department')} type="text" placeholder="Computer Science" className={inputCls} />
                </div>
                {errors.department && <p className="text-xs text-red-600 mt-1">{errors.department.message}</p>}
              </div>
            </div>

            {/* Institution */}
            <div>
              <label className={labelCls}>
                Institution <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className={iconCls} />
                <input {...register('institution')} type="text" placeholder="State University" className={inputCls} />
              </div>
              {errors.institution && <p className="text-xs text-red-600 mt-1">{errors.institution.message}</p>}
            </div>

            {/* Mandatory Consent Checkbox */}
            <div className="p-3.5 bg-peerity-100/60 border border-peerity-200 rounded-xl space-y-1.5">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('consentAgreed')}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-peerity-800 focus:ring-peerity-600 focus:ring-offset-0 transition cursor-pointer"
                />
                <span className="text-xs text-slate-800 leading-relaxed font-body">
                  <span className="text-rose-500 font-bold mr-1">*</span>
                  I understand my submissions are reviewed anonymously, and my identity may only be disclosed through committee-approved quorum review.{" "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-peerity-800 hover:text-peerity-900 font-bold underline underline-offset-2"
                  >
                    Read our Privacy & Cryptography Policy
                  </Link>
                </span>
              </label>
              {errors.consentAgreed && (
                <p className="text-xs text-rose-600 font-semibold pl-6">{errors.consentAgreed.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 mt-2 bg-peerity-800 hover:bg-peerity-600 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 font-display"
            >
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account...</>
                : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-peerity-800 hover:text-peerity-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
