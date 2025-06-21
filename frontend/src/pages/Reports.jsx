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
import html2canvas from 'html2canvas'; // Import html2canvas
import jsPDF from 'jspdf';             // Import jsPDF

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

    // State variables for report data
    const [loading, setLoading] = useState(true);
    const [categorySalesData, setCategorySalesData] = useState({});
    const [productSalesData, setProductSalesData] = useState({});
    const [salesTrendsData, setSalesTrendsData] = useState({});
    const [topSellingProducts, setTopSellingProducts] = useState([]);
    const [leastSellingProducts, setLeastSellingProducts] = useState([]);
    const [realtimeAnalytics, setRealtimeAnalytics] = useState(null);
    const [dailySalesProgress, setDailySalesProgress] = useState(null);

    // State variables for sales trend filters
    const [salesTrendPeriod, setSalesTrendPeriod] = useState('month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // User information from local storage
    const user = JSON.parse(localStorage.getItem('user'));
    const userName = user ? user.username : 'User';
    const token = localStorage.getItem('token');

    // Function to generate random colors for charts
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

    // useEffect to fetch all report data when component mounts or token changes
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

    // useEffect to fetch sales trends data based on period/date filters
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
                    const sortedData = data.sort((a, b) => {
                        // Custom sort for week-based data
                        if (typeof a._id === 'object' && a._id.year && a._id.week) {
                            if (a._id.year !== b._id.year) return a._id.year - b._id.year;
                            return a._id.week - b._id.week;
                        }
                        // Default string/date sort
                        return String(a._id).localeCompare(String(b._id));
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

    // Chart.js options for Bar and Line charts
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#cbd5e1' // Tailwind gray-300 for legend text
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
                titleColor: '#e2e8f0', // Tailwind gray-200
                bodyColor: '#cbd5e1', // Tailwind gray-300
                backgroundColor: 'rgba(31, 41, 55, 0.9)', // Tailwind gray-800 with transparency
                borderColor: '#4a5568', // Tailwind gray-600
                borderWidth: 1,
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#cbd5e1' // Tailwind gray-300 for x-axis labels
                },
                grid: {
                    color: 'rgba(74, 85, 104, 0.2)' // Tailwind gray-700 with transparency
                }
            },
            y: {
                ticks: {
                    color: '#cbd5e1', // Tailwind gray-300 for y-axis labels
                    callback: function(value) {
                        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
                    }
                },
                grid: {
                    color: 'rgba(74, 85, 104, 0.2)' // Tailwind gray-700 with transparency
                }
            }
        }
    };

    // Chart.js options for Pie chart (slightly different due to radial scale)
    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#cbd5e1' // Tailwind gray-300
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

    // Logout handler
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // --- NEW FUNCTION FOR PDF GENERATION ---
    const generatePdfReport = async () => {
        setLoading(true); // Indicate that PDF generation is in progress
        const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size
        const pageHeight = pdf.internal.pageSize.height;
        let yPos = 10; // Initial Y position for content

        // Helper function to add a title to the PDF
        const addTitle = (title, fontSize = 20) => {
            pdf.setFontSize(fontSize);
            pdf.setTextColor(255, 255, 255); // White color for title
            pdf.text(title, 105, yPos, { align: 'center' }); // Center align
            yPos += 10; // Increase Y position for next element
        };

        // Helper function to add a subtitle to the PDF
        const addSubtitle = (subtitle, fontSize = 14) => {
            pdf.setFontSize(fontSize);
            pdf.setTextColor(200, 200, 200); // Lighter gray for subtitles
            pdf.text(subtitle, 10, yPos);
            yPos += 7;
        };

        // Helper function to add general text to the PDF
        const addText = (text, fontSize = 10, color = [180, 180, 180]) => {
            pdf.setFontSize(fontSize);
            pdf.setTextColor(color[0], color[1], color[2]);
            pdf.text(text, 10, yPos);
            yPos += 6;
        };

        // Helper function to add charts to the PDF by capturing their HTML elements
        const addChart = async (elementId, title) => {
            const chartElement = document.getElementById(elementId);
            if (chartElement) {
                // html2canvas options: capture the background color, use CORS if elements from other origins, enable logging
                const canvas = await html2canvas(chartElement, {
                    backgroundColor: '#1f2937', // Match your component's background color (gray-800)
                    useCORS: true,
                    logging: true,
                });
                const imgData = canvas.toDataURL('image/png'); // Get image data as PNG
                const imgWidth = 190; // Image width on PDF (A4 width 210mm - 2*10mm margins)
                const imgHeight = (canvas.height * imgWidth) / canvas.width; // Calculate proportional height

                // Check if new page is needed before adding the chart
                if (yPos + imgHeight + 20 > pageHeight) { // 20mm bottom margin
                    pdf.addPage();
                    yPos = 10; // Reset Y position for new page
                }
                
                addSubtitle(title); // Add chart title
                pdf.addImage(imgData, 'PNG', 10, yPos, imgWidth, imgHeight); // Add image to PDF
                yPos += imgHeight + 10; // Move Y position down after adding image + margin
            }
        };

        // --- PDF Content Generation ---

        // Header Section
        pdf.setFont('helvetica'); // Set font
        pdf.setFillColor(31, 41, 55); // Tailwind gray-800 for header background
        pdf.rect(0, 0, pdf.internal.pageSize.width, 30, 'F'); // Draw header rectangle
        pdf.setFontSize(24);
        pdf.setTextColor(255, 255, 255); // White text
        pdf.text('BizSight. Sales Report', 105, 15, { align: 'center' });
        pdf.setFontSize(10);
        pdf.setTextColor(180, 180, 180); // Lighter gray for header subtitle
        pdf.text(`Generated by ${userName} on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, 25, { align: 'center' });

        yPos = 40; // Start content below the header area

        // Overview Section
        addTitle('Overview', 18);
        addText(`Daily Sales Today: ₹${dailySalesProgress?.totalSalesToday ? dailySalesProgress.totalSalesToday.toFixed(2) : '0.00'}`, 12);
        addText(`Items Sold Today: ${dailySalesProgress?.totalQuantitySoldToday || 0} units`, 12);
        addText(`Weekly Sales Comparison: ${realtimeAnalytics?.salesTrendMessage || 'N/A'}`, 12);
        // Color the sales change percentage based on its value
        addText(`Change: ${realtimeAnalytics?.salesChangePercent || '0.00'}%`, 12, parseFloat(realtimeAnalytics?.salesChangePercent) >= 0 ? [0, 200, 0] : [200, 0, 0]); // Green for increase, Red for decrease
        yPos += 10; // Extra space after overview

        // Call addChart for each chart section. Ensure the IDs match the HTML elements.
        if (categorySalesData.labels && categorySalesData.labels.length > 0) {
            await addChart('category-sales-chart-container', 'Sales by Category Breakdown');
        } else {
             addText('No Category Sales data to display.', 10, [150, 150, 150]);
             yPos += 10;
        }

        if (productSalesData.labels && productSalesData.labels.length > 0) {
            await addChart('product-sales-chart-container', 'Sales by Product Overview');
        } else {
            addText('No Product Sales data to display.', 10, [150, 150, 150]);
            yPos += 10;
        }

        if (salesTrendsData.labels && salesTrendsData.labels.length > 0) {
             await addChart('sales-trends-chart-container', `Sales Trends (${salesTrendPeriod.charAt(0).toUpperCase() + salesTrendPeriod.slice(1)})`);
        } else {
            addText('No Sales Trend data to display for the selected period.', 10, [150, 150, 150]);
            yPos += 10;
        }

        // Top Selling Products List
        if (topSellingProducts.length > 0) {
            if (yPos + 50 > pageHeight - 20) { // Estimate space needed for list, add new page if necessary
                pdf.addPage();
                yPos = 10;
            }
            addSubtitle('Top 5 Selling Products');
            topSellingProducts.forEach((product, index) => {
                addText(`${index + 1}. ${product.productName} (₹${product.totalRevenue ? product.totalRevenue.toFixed(2) : '0.00'} revenue, ${product.totalQuantitySold || 0} sold)`);
            });
            yPos += 10; // Space after list
        } else {
            addText('No Top Selling Products data available.', 10, [150, 150, 150]);
            yPos += 10;
        }

        // Least Selling Products List
        if (leastSellingProducts.length > 0) {
            if (yPos + 50 > pageHeight - 20) { // Estimate space needed for list, add new page if necessary
                pdf.addPage();
                yPos = 10;
            }
            addSubtitle('Least 5 Selling Products');
            leastSellingProducts.forEach((product, index) => {
                addText(`${index + 1}. ${product.productName} (₹${product.totalRevenue ? product.totalRevenue.toFixed(2) : '0.00'} revenue, ${product.totalQuantitySold || 0} sold)`);
            });
            yPos += 10; // Space after list
        } else {
            addText('No Least Selling Products data available.', 10, [150, 150, 150]);
            yPos += 10;
        }

        // Save the PDF with a dynamic filename
        pdf.save(`BizSight_Sales_Report_${new Date().toISOString().slice(0,10)}.pdf`);
        setLoading(false); // Hide loading after PDF generation is complete
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
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-white">Sales Reports & Analytics</h1>
                        {/* Download PDF Report button */}
                        <button
                            onClick={generatePdfReport}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition duration-200"
                            disabled={loading} // Disable button while data is loading or PDF is generating
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M.015 11.233L10 16.5 19.985 11.233V.5H.015v10.733zM10 18.5l-9.985-5.233V17.5c0 1.38 1.12 2.5 2.5 2.5h14.97c1.38 0 2.5-1.12 2.5-2.5v-4.233L10 18.5z" clipRule="evenodd" />
                                <path d="M12 9.5a.5.5 0 00-1 0v3.793l-1.146-1.147a.5.5 0 00-.708.708l2 2a.5.5 0 00.708 0l2-2a.5.5 0 00-.708-.708L12 13.293V9.5z" />
                            </svg>
                            {loading ? 'Generating PDF...' : 'Download PDF Report'}
                        </button>
                    </div>

                    {loading && !categorySalesData.labels && !productSalesData.labels ? (
                        <p className="text-gray-400">Loading sales reports and analytics...</p>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            {/* Daily Sales Progress Card */}
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

                                {/* Progress Bar and message for daily sales */}
                                <div className="mt-6 pt-4 border-t border-gray-700">
                                    <p className="text-sm text-gray-500">Data updates throughout the day.</p>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                        <div
                                            className="bg-green-500 h-2.5 rounded-full"
                                            // Assuming a daily sales goal of ₹10,000 for progress bar example
                                            style={{ width: `${Math.min(100, ((dailySalesProgress?.totalSalesToday || 0) / 10000) * 100).toFixed(0)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {dailySalesProgress?.totalSalesToday > 0 ? `Target progress: ${Math.min(100, ((dailySalesProgress?.totalSalesToday || 0) / 10000) * 100).toFixed(0)}%` : 'Set a daily goal to track progress!'}
                                    </p>
                                </div>
                            </div>

                            {/* Real-time Analytics / Sales Comparison Card */}
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

                            {/* Category-wise Sales Breakdown (Pie Chart) - ADDED ID FOR PDF CAPTURE */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md col-span-1" id="category-sales-chart-container">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">Sales by Category</h2>
                                {categorySalesData.labels && categorySalesData.labels.length > 0 ? (
                                    <div className="relative w-full" style={{ height: '350px' }}>
                                        <Pie data={categorySalesData} options={pieOptions} />
                                    </div>
                                ) : (
                                    <p className="text-gray-400">No category sales data available.</p>
                                )}
                            </div>

                            {/* Product-wise Sales Breakdown (Bar Chart) - ADDED ID FOR PDF CAPTURE */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md col-span-full xl:col-span-2" id="product-sales-chart-container">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">Sales by Product</h2>
                                {productSalesData.labels && productSalesData.labels.length > 0 ? (
                                    <div style={{ height: '400px' }}>
                                        <Bar data={productSalesData} options={chartOptions} />
                                    </div>
                                ) : (
                                    <p className="text-gray-400">No product sales data available.</p>
                                )}
                            </div>

                            {/* Sales Trends Over Time (Line Chart) - ADDED ID FOR PDF CAPTURE */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md col-span-full" id="sales-trends-chart-container">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">Sales Trends</h2>
                                <div className="mb-4 flex flex-wrap items-center space-x-4">
                                    <label htmlFor="period-select" className="text-gray-300 mr-2">View by:</label>
                                    <select
                                        id="period-select"
                                        className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 p-2.5"
                                        value={salesTrendPeriod}
                                        onChange={(e) => {
                                            setSalesTrendPeriod(e.target.value);
                                            setCustomStartDate(''); // Clear custom dates when period changes
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

                            {/* Top 5 Selling Products List */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md col-span-1">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">Top 5 Selling Products</h2>
                                {topSellingProducts.length > 0 ? (
                                    <ul className="space-y-2">
                                        {topSellingProducts.map((product, index) => (
                                            <li key={product._id} className="text-gray-300">
                                                {index + 1}. {product.productName} (₹{product.totalRevenue ? product.totalRevenue.toFixed(2) : '0.00'} revenue, {product.totalQuantitySold || 0} sold)
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-400">No top selling products data available.</p>
                                )}
                            </div>

                            {/* Least 5 Selling Products List */}
                            <div className="bg-gray-800 p-6 rounded-lg shadow-md col-span-1">
                                <h2 className="text-xl font-semibold text-gray-300 mb-4">Least 5 Selling Products</h2>
                                {leastSellingProducts.length > 0 ? (
                                    <ul className="space-y-2">
                                        {leastSellingProducts.map((product, index) => (
                                            <li key={product._id} className="text-gray-300">
                                                {index + 1}. {product.productName} (₹{product.totalRevenue ? product.totalRevenue.toFixed(2) : '0.00'} revenue, {product.totalQuantitySold || 0} sold)
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