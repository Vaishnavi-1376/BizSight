// frontend/src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    PointElement,
    LineElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    PointElement,
    LineElement
);

const Reports = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // State variables for loading and data for each report type
    const [loading, setLoading] = useState(true);
    const [categorySalesData, setCategorySalesData] = useState({});
    const [productSalesData, setProductSalesData] = useState({});
    const [salesTrendsData, setSalesTrendsData] = useState({});
    const [topSellingProducts, setTopSellingProducts] = useState([]);
    const [leastSellingProducts, setLeastSellingProducts] = useState([]);
    const [realtimeAnalytics, setRealtimeAnalytics] = useState(null);
    const [dailySalesProgress, setDailySalesProgress] = useState(null);

    // State for selected period for sales trends
    const [salesTrendPeriod, setSalesTrendPeriod] = useState('month'); // Default to month
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const user = JSON.parse(localStorage.getItem('user'));
    const userName = user ? user.username : 'User';

    const token = localStorage.getItem('token');

    // Utility function to generate random colors for charts
    const generateColors = (count) => {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const r = Math.floor(Math.random() * 255);
            const g = Math.floor(Math.random() * 255);
            const b = Math.floor(Math.random() * 255);
            colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
        }
        return colors;
    };

    // Main data fetching effect
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch Category Sales
                const categoryResponse = await fetch('http://localhost:5000/api/reports/category-sales', { headers });
                const categoryData = await categoryResponse.json();
                if (categoryResponse.ok) {
                    const labels = categoryData.map(d => d._id || 'Uncategorized');
                    const revenues = categoryData.map(d => d.totalRevenue);
                    setCategorySalesData({
                        labels: labels,
                        datasets: [{
                            label: 'Sales by Category (₹)',
                            data: revenues,
                            backgroundColor: generateColors(labels.length),
                            borderColor: generateColors(labels.length).map(color => color.replace('0.7', '1')),
                            borderWidth: 1,
                        }],
                    });
                } else {
                    console.error('Failed to fetch category sales:', categoryData.message);
                }

                // Fetch Product Sales
                const productResponse = await fetch('http://localhost:5000/api/reports/product-sales', { headers });
                const productData = await productResponse.json();
                if (productResponse.ok) {
                    const labels = productData.map(d => d.productName);
                    const revenues = productData.map(d => d.totalRevenue);
                    setProductSalesData({
                        labels: labels,
                        datasets: [{
                            label: 'Sales by Product (₹)',
                            data: revenues,
                            backgroundColor: 'rgba(75, 192, 192, 0.7)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1,
                        }],
                    });
                } else {
                    console.error('Failed to fetch product sales:', productData.message);
                }

                // Fetch Top Selling Products
                const topResponse = await fetch('http://localhost:5000/api/reports/top-least-selling?type=top&limit=5', { headers });
                const topData = await topResponse.json();
                if (topResponse.ok) {
                    setTopSellingProducts(topData);
                } else {
                    console.error('Failed to fetch top selling products:', topData.message);
                }

                // Fetch Least Selling Products
                const leastResponse = await fetch('http://localhost:5000/api/reports/top-least-selling?type=least&limit=5', { headers });
                const leastData = await leastResponse.json();
                if (leastResponse.ok) {
                    setLeastSellingProducts(leastData);
                } else {
                    console.error('Failed to fetch least selling products:', leastData.message);
                }

                // Fetch Real-time Analytics
                const realtimeResponse = await fetch('http://localhost:5000/api/reports/realtime-analytics', { headers });
                const realtimeData = await realtimeResponse.json();
                if (realtimeResponse.ok) {
                    setRealtimeAnalytics(realtimeData);
                } else {
                    console.error('Failed to fetch real-time analytics:', realtimeData.message);
                }

                // Fetch Daily Sales Progress
                const dailyResponse = await fetch('http://localhost:5000/api/reports/daily-sales-progress', { headers });
                const dailyData = await dailyResponse.json();
                if (dailyResponse.ok) {
                    setDailySalesProgress(dailyData);
                } else {
                    console.error('Failed to fetch daily sales progress:', dailyData.message);
                }

            } catch (error) {
                console.error('Failed to fetch reports data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, token]); // Re-run effect if navigate or token changes

    // Effect for sales trends, dependent on salesTrendPeriod and custom dates
    useEffect(() => {
        const fetchSalesTrends = async () => {
            if (!token) return;

            let url = `http://localhost:5000/api/reports/sales-trends?period=${salesTrendPeriod}`;
            if (salesTrendPeriod === 'custom' && customStartDate && customEndDate) {
                url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
            }

            try {
                const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await response.json();

                if (response.ok) {
                    // Sort data by date/period to ensure correct trend display
                    const sortedData = data.sort((a, b) => {
                        if (typeof a._id === 'object' && a._id.year && a._id.week) {
                            // For weekly data
                            if (a._id.year !== b._id.year) return a._id.year - b._id.year;
                            return a._id.week - b._id.week;
                        }
                        // For daily/monthly/yearly string formats
                        return a._id.localeCompare(b._id);
                    });


                    const labels = sortedData.map(d => {
                        if (typeof d._id === 'object' && d._id.year && d._id.week) {
                            return `Week ${d._id.week}, ${d._id.year}`;
                        }
                        return d._id;
                    });
                    const sales = sortedData.map(d => d.totalSales);

                    setSalesTrendsData({
                        labels: labels,
                        datasets: [{
                            label: 'Sales Trend (₹)',
                            data: sales,
                            fill: false,
                            borderColor: 'rgb(255, 159, 64)',
                            tension: 0.1,
                        }],
                    });
                } else {
                    console.error('Failed to fetch sales trends:', data.message);
                }
            } catch (error) {
                console.error('Error fetching sales trends:', error);
            }
        };

        fetchSalesTrends();
    }, [salesTrendPeriod, customStartDate, customEndDate, token]);

    // Chart options for dark theme
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#cbd5e1' // text-gray-300
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y);
                        }
                        return label;
                    }
                },
                titleColor: '#e2e8f0', // text-gray-200
                bodyColor: '#cbd5e1', // text-gray-300
                backgroundColor: 'rgba(31, 41, 55, 0.9)', // gray-800 with transparency
                borderColor: '#4a5568', // gray-700
                borderWidth: 1,
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#cbd5e1' // text-gray-300
                },
                grid: {
                    color: 'rgba(74, 85, 104, 0.2)' // gray-700 with transparency
                }
            },
            y: {
                ticks: {
                    color: '#cbd5e1', // text-gray-300
                    callback: function(value) {
                        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
                    }
                },
                grid: {
                    color: 'rgba(74, 85, 104, 0.2)' // gray-700 with transparency
                }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false, // <-- IMPORTANT: Set this to false for better sizing
        plugins: {
            legend: {
                labels: {
                    color: '#cbd5e1' // text-gray-300
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed);
                        }
                        return label;
                    }
                },
                titleColor: '#e2e8f0',
                bodyColor: '#cbd5e1',
                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                borderColor: '#4a5568',
                borderWidth: 1,
            }
        }
    };


    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 p-6 flex flex-col shadow-lg">
                <div className="text-2xl font-bold text-white mb-8">BizSight.</div>
                <nav className="space-y-4">
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

                {/* Reports Specific Content Area */}
                <main className="flex-1 overflow-y-auto p-8">
                    <h1 className="text-3xl font-bold text-white mb-8">Sales Reports & Analytics</h1>

                    {loading ? (
                        <p className="text-gray-400">Loading sales reports and analytics...</p>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            {/* Daily Sales Progress */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-300 mb-4">Daily Sales Overview</h2>
                                    {dailySalesProgress ? (
                                        <>
                                            <p className="text-lg text-gray-400 mb-1">Current Sales Today:</p>
                                            <p className="text-3xl font-bold text-green-400 mb-4">
                                                ₹{dailySalesProgress.totalSalesToday ? dailySalesProgress.totalSalesToday.toFixed(2) : '0.00'}
                                            </p>
                                            <p className="text-lg text-gray-400 mb-1">Items Sold Today:</p>
                                            <p className="text-2xl font-bold text-blue-400">
                                                {dailySalesProgress.totalQuantitySoldToday || 0} units
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-gray-400">No daily sales data available.</p>
                                    )}
                                </div>

                                {/* Simple visual indicator / placeholder for future progress bar */}
                                <div className="mt-6 pt-4 border-t border-gray-700">
                                    <p className="text-sm text-gray-500">Data updates throughout the day.</p>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                        {/* Example of a static "progress" bar for visual fill. Can be made dynamic later. */}
                                        <div
                                            className="bg-green-500 h-2.5 rounded-full"
                                            style={{ width: `${Math.min(100, (dailySalesProgress?.totalSalesToday / 10000) * 100).toFixed(0)}%` }} /* Example: 10000 is a hypothetical daily target */
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {dailySalesProgress?.totalSalesToday > 0 ? `Target progress: ${Math.min(100, (dailySalesProgress?.totalSalesToday / 10000) * 100).toFixed(0)}%` : 'Set a daily goal to track progress!'}
                                    </p>
                                </div>
                            </div>

                            {/* Real-time Analytics / Sales Comparison */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md col-span-1">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">Weekly Sales Comparison</h2>
                                {realtimeAnalytics ? (
                                    <>
                                        <p className="text-lg text-gray-300 mb-2">{realtimeAnalytics.salesTrendMessage}</p>
                                        <p className={`text-2xl font-bold ${parseFloat(realtimeAnalytics.salesChangePercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            Change: {realtimeAnalytics.salesChangePercent}%
                                        </p>
                                        {realtimeAnalytics.trendingProducts && realtimeAnalytics.trendingProducts.length > 0 && (
                                            <div className="mt-4">
                                                <h3 className="text-md font-semibold text-gray-300 mb-2">Trending Products:</h3>
                                                <ul className="list-disc list-inside text-gray-400">
                                                    {realtimeAnalytics.trendingProducts.map((p, index) => (
                                                        <li key={index}>{p.productName}: {p.trend} (Current: {p.currentWeekQuantity}, Prev: {p.previousWeekQuantity})</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {realtimeAnalytics.trendingProducts && realtimeAnalytics.trendingProducts.length === 0 && (
                                            <p className="text-gray-400 mt-4">No significant product trends this week.</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-gray-400">No real-time analytics data available.</p>
                                )}
                            </div>

                            {/* Category-wise Sales Breakdown (Pie Chart) */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md col-span-1">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">Sales by Category</h2>
                                {categorySalesData.labels && categorySalesData.labels.length > 0 ? (
                                    // Adjusted container for better sizing
                                    <div className="relative w-full" style={{ height: '350px' }}>
                                        <Pie data={categorySalesData} options={pieOptions} />
                                    </div>
                                ) : (
                                    <p className="text-gray-400">No category sales data available.</p>
                                )}
                            </div>

                            {/* Product-wise Sales Breakdown (Bar Chart) */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md col-span-full xl:col-span-2">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">Sales by Product</h2>
                                {productSalesData.labels && productSalesData.labels.length > 0 ? (
                                    <div style={{ height: '400px' }}>
                                        <Bar data={productSalesData} options={chartOptions} />
                                    </div>
                                ) : (
                                    <p className="text-gray-400">No product sales data available.</p>
                                )}
                            </div>

                            {/* Sales Trends Over Time (Line Chart) */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md col-span-full">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">Sales Trends</h2>
                                <div className="mb-4 flex flex-wrap items-center space-x-4">
                                    <label htmlFor="period-select" className="text-gray-300 mr-2">View by:</label>
                                    <select
                                        id="period-select"
                                        className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 p-2.5"
                                        value={salesTrendPeriod}
                                        onChange={(e) => {
                                            setSalesTrendPeriod(e.target.value);
                                            setCustomStartDate(''); // Clear custom dates on period change
                                            setCustomEndDate('');
                                        }}
                                    >
                                        <option value="day">Day</option>
                                        <option value="week">Week</option>
                                        <option value="month">Month</option>
                                        <option value="year">Year</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                    {salesTrendPeriod === 'custom' && (
                                        <div className="flex items-center space-x-2 mt-2 md:mt-0">
                                            <input
                                                type="date"
                                                className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 p-2.5"
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                            />
                                            <span className="text-gray-300">to</span>
                                            <input
                                                type="date"
                                                className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 p-2.5"
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                                {salesTrendsData.labels && salesTrendsData.labels.length > 0 ? (
                                    <div style={{ height: '400px' }}>
                                        <Line data={salesTrendsData} options={chartOptions} />
                                    </div>
                                ) : (
                                    <p className="text-gray-400">No sales trend data available for the selected period.</p>
                                )}
                            </div>

                            {/* Top 5 Selling Products */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md col-span-1">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">Top 5 Selling Products</h2>
                                {topSellingProducts.length > 0 ? (
                                    <ul className="space-y-2">
                                        {topSellingProducts.map((product, index) => (
                                            <li key={product._id} className="text-gray-300">
                                                {index + 1}. {product.productName} (₹{product.totalRevenue.toFixed(2)} revenue, {product.totalQuantitySold} sold)
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-400">No top selling products data available.</p>
                                )}
                            </div>

                            {/* Least 5 Selling Products */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md col-span-1">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">Least 5 Selling Products</h2>
                                {leastSellingProducts.length > 0 ? (
                                    <ul className="space-y-2">
                                        {leastSellingProducts.map((product, index) => (
                                            <li key={product._id} className="text-gray-300">
                                                {index + 1}. {product.productName} (₹{product.totalRevenue.toFixed(2)} revenue, {product.totalQuantitySold} sold)
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-400">No least selling products data available.</p>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Reports;