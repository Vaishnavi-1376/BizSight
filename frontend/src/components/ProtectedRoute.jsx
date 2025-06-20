// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token'); // Check if token exists in local storage
    
    // If a token exists, render the child routes (Outlet)
    // Otherwise, redirect to the login page
    return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;