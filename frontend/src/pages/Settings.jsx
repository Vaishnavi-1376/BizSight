// frontend/src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Settings = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [appSettings, setAppSettings] = useState(null); // Renamed from 'settings' to avoid confusion with user settings
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Profile fields state
    const [currentFullName, setCurrentFullName] = useState('');
    const [currentUsername, setCurrentUsername] = useState('');
    const [currentEmail, setCurrentEmail] = useState('');
    const [currentMobileNumber, setCurrentMobileNumber] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [profileMessage, setProfileMessage] = useState(''); // For profile update feedback

    const [theme, setTheme] = useState('dark'); // Default theme

    const user = JSON.parse(localStorage.getItem('user'));
    const userName = user ? user.username : 'User';
    const token = localStorage.getItem('token');

    // Fetch settings on component mount
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchAllSettings = async () => {
            setLoading(true);
            try {
                // Fetch App Settings
                const appSettingsResponse = await fetch('http://localhost:5000/api/settings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!appSettingsResponse.ok) {
                    throw new Error(`HTTP error! status: ${appSettingsResponse.status} from app settings`);
                }
                const appSettingsData = await appSettingsResponse.json();
                setAppSettings(appSettingsData);

                // Initialize current user profile fields from localStorage or a fresh fetch if needed
                setCurrentFullName(user.fullName || '');
                setCurrentUsername(user.username || '');
                setCurrentEmail(user.email || '');
                setCurrentMobileNumber(user.mobileNumber || '');
                setTheme(localStorage.getItem('theme') || 'dark'); // Load theme from local storage
            } catch (error) {
                console.error('Failed to fetch settings:', error);
                setProfileMessage(`Error loading settings: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchAllSettings();
    }, [navigate, token, user.fullName, user.username, user.email, user.mobileNumber]);

    // Apply theme to body class
    // This useEffect is crucial for applying the theme class to the body tag
    useEffect(() => {
        document.body.className = theme === 'light' ? 'light-theme' : 'dark-theme';
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('theme'); // Clear theme on logout
        navigate('/login');
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileMessage('');

        let hasProfileChanges = false;
        if (currentFullName !== user.fullName ||
            currentUsername !== user.username ||
            currentEmail !== user.email ||
            currentMobileNumber !== user.mobileNumber) {
            hasProfileChanges = true;
        }

        let hasPasswordChanges = false;
        if (newPassword) {
            if (newPassword !== confirmNewPassword) {
                setProfileMessage('New passwords do not match!');
                return;
            }
            hasPasswordChanges = true;
        }

        if (!hasProfileChanges && !hasPasswordChanges) {
            setProfileMessage('No changes to update.');
            return;
        }

        try {
            if (hasProfileChanges) {
                const profileUpdateResponse = await fetch(`http://localhost:5000/api/auth/update-profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        fullName: currentFullName,
                        username: currentUsername,
                        email: currentEmail,
                        mobileNumber: currentMobileNumber,
                    })
                });

                const profileUpdateData = await profileUpdateResponse.json();
                if (!profileUpdateResponse.ok) {
                    throw new Error(profileUpdateData.message || 'Failed to update profile.');
                }

                const updatedUser = {
                    ...user,
                    fullName: profileUpdateData.fullName,
                    username: profileUpdateData.username,
                    email: profileUpdateData.email,
                    mobileNumber: profileUpdateData.mobileNumber,
                };
                localStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage
                setProfileMessage('Profile updated successfully!');
            }

            if (hasPasswordChanges) {
                const passwordUpdateResponse = await fetch(`http://localhost:5000/api/auth/update-password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ newPassword })
                });

                const passwordUpdateData = await passwordUpdateResponse.json();
                if (!passwordUpdateResponse.ok) {
                    throw new Error(passwordUpdateData.message || 'Failed to update password.');
                }
                setProfileMessage(prev => prev + (prev ? ' and ' : '') + 'Password updated successfully!');
                setNewPassword('');
                setConfirmNewPassword('');
            }
            setIsEditingProfile(false); // Exit edit mode after successful update
        } catch (error) {
            console.error('Profile update failed:', error);
            setProfileMessage(`Error: ${error.message}`);
        }
    };

    const resetProfileForm = () => {
        setCurrentFullName(user.fullName || '');
        setCurrentUsername(user.username || '');
        setCurrentEmail(user.email || '');
        setCurrentMobileNumber(user.mobileNumber || '');
        setNewPassword('');
        setConfirmNewPassword('');
        setProfileMessage('');
        setIsEditingProfile(false);
    };

    return (
        // Removed the theme class from this div as the theme is applied to the body
        <div className={`flex h-screen bg-gray-900 text-gray-100 font-sans`}>
            {/* Sidebar (Copied from your existing pages) */}
            <aside className="w-64 bg-gray-800 p-6 flex flex-col shadow-lg">
                <div className="text-2xl font-bold text-white mb-8">BizSight.</div>
                <nav className="space-y-4">
                    <a href="/dashboard" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/dashboard' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Dashboard</a>
                    <a href="/inventory" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/inventory' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Inventory</a>
                    <a href="/sales" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/sales' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Sales</a>
                    <a href="/reports" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/reports' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Reports</a>
                    {/* Highlight Settings link */}
                    <a href="/settings" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/settings' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Settings</a>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navbar (Copied from your existing pages) */}
                <header className="flex items-center justify-end p-6 bg-gray-800 shadow-lg">
                    <div className="flex items-center space-x-4">
                        <span className="text-lg text-gray-300">[{userName}]</span>
                        <button onClick={handleLogout} className="text-gray-300 hover:text-red-400 transition-colors duration-200 focus:outline-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Settings Specific Content Area */}
                <main className="flex-1 overflow-y-auto p-8">
                    <h1 className="text-3xl font-bold text-white mb-8">Application Settings</h1>

                    {loading ? (
                        <p className="text-gray-400">Loading settings...</p>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* User Profile Management */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">User Profile</h2>
                                {!isEditingProfile ? (
                                    <>
                                        <p className="text-gray-400 mb-2">Full Name: <span className="text-white font-medium">{user.fullName}</span></p>
                                        <p className="text-gray-400 mb-2">Username: <span className="text-white font-medium">{user.username}</span></p>
                                        <p className="text-gray-400 mb-2">Email: <span className="text-white font-medium">{user.email}</span></p>
                                        <p className="text-gray-400 mb-4">Mobile Number: <span className="text-white font-medium">{user.mobileNumber}</span></p>
                                        <button
                                            onClick={() => setIsEditingProfile(true)}
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                                        >
                                            Edit Profile
                                        </button>
                                    </>
                                ) : (
                                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                                        <div>
                                            <label htmlFor="fullName" className="block text-gray-400 text-sm font-bold mb-2">Full Name:</label>
                                            <input
                                                type="text"
                                                id="fullName"
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                                value={currentFullName}
                                                onChange={(e) => setCurrentFullName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="username" className="block text-gray-400 text-sm font-bold mb-2">Username:</label>
                                            <input
                                                type="text"
                                                id="username"
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                                value={currentUsername}
                                                onChange={(e) => setCurrentUsername(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-gray-400 text-sm font-bold mb-2">Email:</label>
                                            <input
                                                type="email"
                                                id="email"
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                                value={currentEmail}
                                                onChange={(e) => setCurrentEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="mobileNumber" className="block text-gray-400 text-sm font-bold mb-2">Mobile Number:</label>
                                            <input
                                                type="text" // Use text for phone numbers to allow various formats, validate on backend if strict
                                                id="mobileNumber"
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                                value={currentMobileNumber}
                                                onChange={(e) => setCurrentMobileNumber(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="newPassword" className="block text-gray-400 text-sm font-bold mb-2">New Password:</label>
                                            <input
                                                type="password"
                                                id="newPassword"
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Leave blank to keep current"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="confirmNewPassword" className="block text-gray-400 text-sm font-bold mb-2">Confirm New Password:</label>
                                            <input
                                                type="password"
                                                id="confirmNewPassword"
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                                value={confirmNewPassword}
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            />
                                        </div>
                                        {profileMessage && <p className={`text-sm mt-2 ${profileMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{profileMessage}</p>}
                                        <div className="flex space-x-4">
                                            <button
                                                type="submit"
                                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                                            >
                                                Save Changes
                                            </button>
                                            <button
                                                type="button"
                                                onClick={resetProfileForm}
                                                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* User Theme Toggle */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">User Theme</h2>
                                <div className="flex items-center space-x-4">
                                    <span className="text-gray-400">Dark Mode</span>
                                    <label htmlFor="theme-toggle" className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id="theme-toggle"
                                            className="sr-only peer"
                                            checked={theme === 'light'}
                                            onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-green-600"></div>
                                    </label>
                                    <span className="text-gray-400">Light Mode</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">Changes the visual theme of the application.</p>
                            </div>

                            {/* PDF Report Branding Settings */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">PDF Report Branding</h2>
                                <p className="text-gray-400">Settings for company logo, footer text, etc.</p>
                                <div className="mt-4 space-y-3">
                                    <div>
                                        <label htmlFor="companyName" className="block text-gray-400 text-sm font-bold mb-1">Company Name:</label>
                                        <input
                                            type="text"
                                            id="companyName"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                            value={appSettings?.companyName || ''}
                                            onChange={(e) => setAppSettings(prev => ({ ...prev, companyName: e.target.value }))}
                                            placeholder="Your Company Name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="companyLogoUrl" className="block text-gray-400 text-sm font-bold mb-1">Company Logo URL:</label>
                                        <input
                                            type="url"
                                            id="companyLogoUrl"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                            value={appSettings?.companyLogoUrl || ''}
                                            onChange={(e) => setAppSettings(prev => ({ ...prev, companyLogoUrl: e.target.value }))}
                                            placeholder="https://example.com/logo.png"
                                        />
                                        {appSettings?.companyLogoUrl && (
                                            <img src={appSettings.companyLogoUrl} alt="Company Logo Preview" className="mt-2 h-16 object-contain" onError={(e) => e.target.style.display = 'none'} />
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="reportFooterText" className="block text-gray-400 text-sm font-bold mb-1">Report Footer Text:</label>
                                        <input
                                            type="text"
                                            id="reportFooterText"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                            value={appSettings?.reportFooterText || ''}
                                            onChange={(e) => setAppSettings(prev => ({ ...prev, reportFooterText: e.target.value }))}
                                            placeholder="Custom footer text for your reports"
                                        />
                                    </div>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const response = await fetch('http://localhost:5000/api/settings', {
                                                    method: 'PUT',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({
                                                        companyName: appSettings.companyName,
                                                        companyLogoUrl: appSettings.companyLogoUrl,
                                                        reportFooterText: appSettings.reportFooterText,
                                                    })
                                                });
                                                if (!response.ok) {
                                                    throw new Error('Failed to save branding settings');
                                                }
                                                alert('Branding settings saved!');
                                            } catch (error) {
                                                console.error('Error saving branding settings:', error);
                                                alert(`Error: ${error.message}`);
                                            }
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                                    >
                                        Save Branding Settings
                                    </button>
                                </div>
                            </div>

                            {/* Alert Threshold Settings */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">Alert Thresholds</h2>
                                <p className="text-gray-400">Set thresholds for low stock and other alerts.</p>
                                <div className="mt-4 space-y-3">
                                    <div>
                                        <label htmlFor="lowStockThreshold" className="block text-gray-400 text-sm font-bold mb-1">Low Stock Quantity:</label>
                                        <input
                                            type="number"
                                            id="lowStockThreshold"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                            value={appSettings?.lowStockThreshold || 0}
                                            onChange={(e) => setAppSettings(prev => ({ ...prev, lowStockThreshold: Number(e.target.value) }))}
                                            min="0"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Receive alerts when product quantity drops below this.</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const response = await fetch('http://localhost:5000/api/settings', {
                                                    method: 'PUT',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({
                                                        lowStockThreshold: appSettings.lowStockThreshold,
                                                    })
                                                });
                                                if (!response.ok) {
                                                    throw new Error('Failed to save alert threshold settings');
                                                }
                                                alert('Alert threshold settings saved!');
                                            } catch (error) {
                                                console.error('Error saving alert threshold settings:', error);
                                                alert(`Error: ${error.message}`);
                                            }
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                                    >
                                        Save Alert Settings
                                    </button>
                                </div>
                            </div>

                            {/* Daily Sales Goal Setting */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">Daily Sales Goal</h2>
                                <p className="text-gray-400">Define your daily sales target.</p>
                                <div className="mt-4 space-y-3">
                                    <div>
                                        <label htmlFor="dailySalesGoal" className="block text-gray-400 text-sm font-bold mb-1">Target Sales Amount (₹):</label>
                                        <input
                                            type="number"
                                            id="dailySalesGoal"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                            value={appSettings?.dailySalesGoal || 0}
                                            onChange={(e) => setAppSettings(prev => ({ ...prev, dailySalesGoal: Number(e.target.value) }))}
                                            min="0"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">This goal will be used in your daily sales progress reports.</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const response = await fetch('http://localhost:5000/api/settings', {
                                                    method: 'PUT',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({
                                                        dailySalesGoal: appSettings.dailySalesGoal,
                                                    })
                                                });
                                                if (!response.ok) {
                                                    throw new Error('Failed to save daily sales goal');
                                                }
                                                alert('Daily sales goal saved!');
                                            } catch (error) {
                                                console.error('Error saving daily sales goal:', error);
                                                alert(`Error: ${error.message}`);
                                            }
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                                    >
                                        Save Daily Sales Goal
                                    </button>
                                </div>
                            </div>

                            {/* Other App Settings (Placeholder) */}
                            {appSettings && (
                                <div className="bg-gray-800 p-6 rounded-lg shadow-md col-span-1 lg:col-span-2">
                                    <h2 className="text-xl font-semibold text-gray-300 mb-4">Other Application Settings</h2>
                                    <p className="text-gray-400">Manage general application preferences.</p>
                                    <div className="mt-4 space-y-3">
                                        <div>
                                            <label htmlFor="currencySymbol" className="block text-gray-400 text-sm font-bold mb-1">Currency Symbol:</label>
                                            <input
                                                type="text"
                                                id="currencySymbol"
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                                value={appSettings?.currencySymbol || '₹'}
                                                onChange={(e) => setAppSettings(prev => ({ ...prev, currencySymbol: e.target.value }))}
                                                placeholder="e.g., ₹, $, €"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="dateFormat" className="block text-gray-400 text-sm font-bold mb-1">Date Format:</label>
                                            <select
                                                id="dateFormat"
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                                                value={appSettings?.dateFormat || 'DD/MM/YYYY'}
                                                onChange={(e) => setAppSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                                            >
                                                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g., 25/12/2023)</option>
                                                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g., 12/25/2023)</option>
                                                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2023-12-25)</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch('http://localhost:5000/api/settings', {
                                                        method: 'PUT',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${token}`
                                                        },
                                                        body: JSON.stringify({
                                                            currencySymbol: appSettings.currencySymbol,
                                                            dateFormat: appSettings.dateFormat,
                                                        })
                                                    });
                                                    if (!response.ok) {
                                                        throw new Error('Failed to save other settings');
                                                    }
                                                    alert('Other settings saved!');
                                                } catch (error) {
                                                    console.error('Error saving other settings:', error);
                                                    alert(`Error: ${error.message}`);
                                                }
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                                        >
                                            Save Other Settings
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Settings;