import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050811]">
        <div className="relative flex items-center justify-center">
          {/* Glowing ring loader */}
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute w-10 h-10 border-4 border-indigo-300/10 border-b-indigo-300 rounded-full animate-spin animate-duration-1000 reverse"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and keep track of intended route
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
