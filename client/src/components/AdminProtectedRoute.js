// src/components/AdminProtectedRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // <-- Import the new library

const AdminProtectedRoute = ({ children }) => {
    const token = sessionStorage.getItem('admin-token');

    // 1. Check if the token even exists
    if (!token) {
        // If no token, not logged in. Redirect to login.
        return <Navigate to="/admin/login" replace />;
    }

    try {
        // 2. Decode the token to check its expiration
        const decodedToken = jwtDecode(token);
        
        // The 'exp' property is a UNIX timestamp (in seconds).
        // We multiply by 1000 to convert it to milliseconds for JavaScript's Date object.
        const isExpired = decodedToken.exp * 1000 < Date.now();

        if (isExpired) {
            // 3. If the token is expired, remove it and redirect to login
            console.warn("Admin token has expired. Logging out.");
            sessionStorage.removeItem('admin-token');
            return <Navigate to="/admin/login" replace />;
        }
        
        // If token exists and is not expired, allow access
        return children;

    } catch (error) {
        // 4. If the token is malformed or invalid, it will cause an error
        console.error("Invalid admin token.", error);
        sessionStorage.removeItem('admin-token');
        return <Navigate to="/admin/login" replace />;
    }
};

export default AdminProtectedRoute;