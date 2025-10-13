// src/components/ProtectedRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
// --- FIX: Make sure this path is correct ---
import { useAuth } from '../contexts/AuthContext'; // Correct path from components folder to context folder

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth(); // Use currentUser from your context

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) { // Check for currentUser
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
