import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Unauthorized: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 mx-auto mb-5">
          <ShieldAlert className="w-7 h-7 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 font-display">Access Denied</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed font-body">
          Your role{' '}
          <span className="font-semibold text-slate-700">({user?.role || 'Guest'})</span>{' '}
          does not have permission to view this resource.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-peerity-800 hover:bg-peerity-600 text-white text-sm font-semibold rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};
