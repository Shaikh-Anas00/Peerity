import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, Role } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  requiredRoles?: Role[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, requiredRoles, children }) => {
  const roles = requiredRoles ?? allowedRoles;
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-peerity-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500 font-body">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  const isProfileComplete = Boolean(
    user.fullName?.trim() && user.institution?.trim() && user.department?.trim()
  );

  // Block access to the rest of the app until required registration fields are filled
  if (!isProfileComplete && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children ? <>{children}</> : <Outlet />;
};
