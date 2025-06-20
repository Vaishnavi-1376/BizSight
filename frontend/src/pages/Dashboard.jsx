// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // <--- ADDED useLocation here
// Import Recharts components
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation(); // <--- ADDED this line to get current path

    const [stats, setStats] = useState({
        totalSalesToday: { value: '...', change: null, timestamp: '' },
        itemsInStock: { value: '...', change: null, timestamp: '' },
        inventoryAlerts: { value: '...', change: null, timestamp: '' },
        topSellingProducts: { value: '...', change: null, timestamp: '' }
    });
    const [weeklySalesData, setWeeklySalesData] = useState([]);
    const [monthlySalesData, setMonthlySalesData] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingCharts, setLoadingCharts] = useState(true);
    const [error, setError] = useState('');

    // Fetch Dashboard Stats
    useEffect(() => {
        const fetchDashboardStats = async () => {
            setLoadingStats(true);
            setError(''); // Clear previous errors
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch('http://localhost:5000/api/dashboard/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch dashboard stats');
                }

                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err.message);
                console.error("Error fetching dashboard stats:", err);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchDashboardStats();
    }, [navigate]);

    // Fetch Chart Data
    useEffect(() => {
        const fetchChartData = async () => {
            setLoadingCharts(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    // This is handled by the stats useEffect, but good to have here too
                    navigate('/login');
                    return;
                }

                // Fetch Weekly Sales Data
                const weeklyResponse = await fetch('http://localhost:5000/api/dashboard/weekly-sales', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!weeklyResponse.ok) {
                    const errorData = await weeklyResponse.json();
                    throw new Error(errorData.message || 'Failed to fetch weekly sales data');
                }
                const weeklyData = await weeklyResponse.json();
                setWeeklySalesData(weeklyData);

                // Fetch Monthly Sales Data
                const monthlyResponse = await fetch('http://localhost:5000/api/dashboard/monthly-sales', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!monthlyResponse.ok) {
                    const errorData = await monthlyResponse.json();
                    throw new Error(errorData.message || 'Failed to fetch monthly sales data');
                }
                const monthlyData = await monthlyResponse.json();
                setMonthlySalesData(monthlyData);

            } catch (err) {
                setError(err.message);
                console.error("Error fetching chart data:", err);
            } finally {
                setLoadingCharts(false);
            }
        };

        fetchChartData();
    }, [navigate]);


    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const user = JSON.parse(localStorage.getItem('user'));
    const userName = user ? user.username : 'User';

    const renderStatCard = (title, statKey, colorClass) => (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
            <div className="flex items-baseline justify-between mb-2">
                <p className={`text-3xl font-bold ${colorClass}`}>
                    {loadingStats ? '...' : stats[statKey].value}
                </p>
                {stats[statKey].change !== null && (
                    <span className={`text-sm font-medium ${stats[statKey].change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {loadingStats ? '' : `${stats[statKey].change > 0 ? '+' : ''}${stats[statKey].change}%`}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-500">
                {loadingStats ? 'Loading...' : `Last updated: ${stats[statKey].timestamp || 'N/A'}`}
            </p>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 p-6 flex flex-col shadow-lg">
                <div className="text-2xl font-bold text-white mb-8">BizSight.</div>
                <nav className="space-y-4">
                    {/* UPDATED hrefs and dynamic active class for links */}
                    <a href="/dashboard" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/dashboard' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Dashboard</a>
                    <a href="/inventory" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/inventory' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Inventory</a>
                    <a href="/sales" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/sales' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Sales</a>
                    <a href="/reports" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/reports' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Reports</a>
                    <a href="/settings" className={`block p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${location.pathname === '/settings' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Settings</a>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navbar */}
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

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto p-8">
                    <h1 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h1>

                    {error && <p className="text-red-400 text-center mb-6">{error}</p>}

                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {renderStatCard("Total Sales Today", "totalSalesToday", "text-green-400")}
                        {renderStatCard("Items in Stock", "itemsInStock", "text-blue-400")}
                        {renderStatCard("Inventory Alerts", "inventoryAlerts", "text-yellow-400")}
                        {renderStatCard("Top Selling Products", "topSellingProducts", "text-red-400")}
                    </div>

                    {/* Sales Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold text-gray-300 mb-4">Weekly Sales</h3>
                            {loadingCharts ? (
                                <div className="h-64 flex items-center justify-center text-gray-400">Loading Weekly Sales Chart...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={weeklySalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                        <XAxis dataKey="date" stroke="#999" />
                                        <YAxis stroke="#999" />
                                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.5)' }} formatter={(value) => `₹${value.toFixed(2)}`} />
                                        <Legend />
                                        <Bar dataKey="sales" fill="#8884d8" name="Total Sales" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold text-gray-300 mb-4">Monthly Sales Trend</h3>
                            {loadingCharts ? (
                                <div className="h-64 flex items-center justify-center text-gray-400">Loading Monthly Sales Chart...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={monthlySalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                        <XAxis dataKey="month" stroke="#999" />
                                        <YAxis stroke="#999" />
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value) => `₹${value.toFixed(2)}`} />
                                        <Legend />
                                        <Line type="monotone" dataKey="sales" stroke="#82ca9d" activeDot={{ r: 8 }} name="Total Sales" />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Other Placeholders (if you had them, ensure they are here. I'm adding generic ones) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold text-gray-300 mb-4">Inventory Overview</h3>
                            <div className="h-64 bg-gray-700 flex items-center justify-center rounded-md text-gray-400">
                                [Detailed Inventory Visualizations Go Here]
                            </div>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold text-gray-300 mb-4">Recent Activity Feed</h3>
                            <div className="h-48 bg-gray-700 flex items-center justify-center rounded-md text-gray-400">
                                [List of Recent Sales/Restocks/Alerts Go Here]
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;