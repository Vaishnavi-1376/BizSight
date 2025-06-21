// frontend/src/App.jsx
import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import ProtectedRoute from './components/ProtectedRoute';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
    // State to hold the application theme
    const [appTheme, setAppTheme] = useState(localStorage.getItem('theme') || 'dark');

    // Effect to apply the theme class to the body and listen for changes
    useEffect(() => {
        // Function to update theme when localStorage changes (e.g., from Settings page)
        const handleStorageChange = () => {
            const storedTheme = localStorage.getItem('theme') || 'dark';
            if (storedTheme !== appTheme) { // Only update state if theme actually changed
                setAppTheme(storedTheme);
            }
        };

        // Apply the current theme to the body initially
        document.body.className = appTheme === 'light' ? 'light-theme' : 'dark-theme';

        // Listen for 'storage' events (when localStorage changes in other tabs/windows, or programmatically)
        window.addEventListener('storage', handleStorageChange);

        // Cleanup: remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [appTheme]); // Re-run this effect if appTheme state changes

    // We don't apply the theme directly to the div here because the body class is used for global styling.
    // The components themselves will pick up body styles or their own theme-dependent classes.
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
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>

                {/* Fallback for any unmatched paths, redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;