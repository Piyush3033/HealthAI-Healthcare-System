import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Redirect to correct platform based on role if accessing root platform route
  useEffect(() => {
    if (isAuthenticated && user && (location.pathname === '/platform1' || location.pathname === '/platform2')) {
      if (user.role === 'patient') {
        window.location.href = '/platform2/dashboard';
      } else if (['admin', 'doctor', 'staff'].includes(user.role)) {
        window.location.href = '/platform1/dashboard';
      }
    }
  }, [isAuthenticated, user, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
