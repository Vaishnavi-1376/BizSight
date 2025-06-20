// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales'; // <-- IMPORT THE NEW SALES COMPONENT
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Routes using the ProtectedRoute component */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/sales" element={<Sales />} /> {/* <-- ADD THE NEW SALES ROUTE */}
                    {/* Add other protected routes here if needed, e.g., for Reports, Settings */}
                    {/* <Route path="/reports" element={<Reports />} /> */}
                    {/* <Route path="/settings" element={<Settings />} /> */}
                </Route>

                {/* Fallback for any unmatched paths, redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} /> {/* Added 'replace' for better UX */}
            </Routes>
        </Router>
    );
}

export default App;