import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Unauthorized: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center">
        <div className="w-14 h-14 bg-red-50 dark:bg-red-950/40 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-900/50 mx-auto mb-5">
          <ShieldAlert className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">Access Denied</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-body">
          Your role{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">({user?.role || 'Guest'})</span>{' '}
          does not have permission to view this resource.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-peerity-800 hover:bg-peerity-600 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};
