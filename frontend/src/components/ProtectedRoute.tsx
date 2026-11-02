import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, Role } from '../context/AuthContext';
import { Spinner } from './ui';

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner label="Verifying session…" />
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
