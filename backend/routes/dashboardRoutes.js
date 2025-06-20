// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // Import your Product model
const Order = require('../models/Order');     // Import your Order model
// --- CHANGE THIS LINE ---
const { protect } = require('../middleware/authMiddleware'); // Import 'protect' using named destructuring

// Helper function to format timestamp nicely
const formatTimestamp = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';

    return d.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true
    });
};

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (requires authentication)
// --- CHANGE THIS LINE (line 25 in your provided code) ---
router.get('/stats', protect, async (req, res) => { // Use 'protect' directly, not 'authMiddleware'
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // --- 1. Total Sales Today ---
        const salesTodayResult = await Order.aggregate([
            { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalSalesToday = salesTodayResult.length > 0 ? salesTodayResult[0].total : 0;

        const salesYesterdayResult = await Order.aggregate([
            { $match: { createdAt: { $gte: yesterday, $lt: today }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalSalesYesterday = salesYesterdayResult.length > 0 ? salesYesterdayResult[0].total : 0;

        let salesChange = null;
        if (totalSalesYesterday > 0) {
            salesChange = ((totalSalesToday - totalSalesYesterday) / totalSalesYesterday * 100).toFixed(2);
        } else if (totalSalesToday > 0) {
            salesChange = 100;
        } else {
            salesChange = 0;
        }

        // --- 2. Items in Stock ---
        const totalStockResult = await Product.aggregate([
            { $group: { _id: null, total: { $sum: '$stock' } } }
        ]);
        const itemsInStock = totalStockResult.length > 0 ? totalStockResult[0].total : 0;

        // --- 3. Inventory Alerts ---
        const lowStockCount = await Product.countDocuments({ stock: { $gt: 0, $lt: 10 } });
        const outOfStockCount = await Product.countDocuments({ stock: 0 });
        const inventoryAlerts = lowStockCount + outOfStockCount;

        // --- 4. Top Selling Products (Example: top product by units sold in last 30 days) ---
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const topProductsResult = await Order.aggregate([
            { $match: { createdAt: { $gte: last30Days }, status: 'completed' } },
            { $unwind: '$products' },
            { $group: {
                _id: '$products.productId',
                totalQuantitySold: { $sum: '$products.quantity' }
            }},
            { $sort: { totalQuantitySold: -1 } },
            { $limit: 1 },
            { $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productInfo'
            }},
            { $unwind: '$productInfo' },
            { $project: {
                _id: 0,
                productName: '$productInfo.name',
                totalQuantitySold: 1
            }}
        ]);

        let topSellingValue = 'N/A';
        if (topProductsResult.length > 0) {
            topSellingValue = `${topProductsResult[0].productName} (${topProductsResult[0].totalQuantitySold} units)`;
        }

        res.json({
            totalSalesToday: {
                value: `₹${totalSalesToday.toFixed(2)}`,
                change: salesChange,
                timestamp: formatTimestamp(new Date())
            },
            itemsInStock: {
                value: itemsInStock,
                change: null,
                timestamp: formatTimestamp(new Date())
            },
            inventoryAlerts: {
                value: inventoryAlerts,
                change: null,
                timestamp: formatTimestamp(new Date())
            },
            topSellingProducts: {
                value: topSellingValue,
                change: null,
                timestamp: formatTimestamp(new Date())
            }
        });

    } catch (err) {
        console.error("Error fetching dashboard stats:", err.message);
        res.status(500).json({ message: 'Server Error: Could not fetch dashboard statistics.' });
    }
});


// @route   GET /api/dashboard/weekly-sales
// @desc    Get weekly sales data for chart (last 7 days)
// @access  Private
router.get('/weekly-sales', protect, async (req, res) => { // Use 'protect' directly here too
    try {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 6);
        last7Days.setHours(0, 0, 0, 0);

        const salesData = await Order.aggregate([
            { $match: { createdAt: { $gte: last7Days, $lte: today }, status: 'completed' } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    totalSales: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const salesMap = new Map();
        salesData.forEach(item => salesMap.set(item._id, item.totalSales));

        const result = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(last7Days);
            date.setDate(last7Days.getDate() + i);
            const dateString = date.toISOString().split('T')[0];
            result.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                sales: salesMap.has(dateString) ? salesMap.get(dateString) : 0
            });
        }

        res.json(result);
    } catch (err) {
        console.error('Error fetching weekly sales:', err.message);
        res.status(500).json({ message: 'Server Error: Could not fetch weekly sales.' });
    }
});

// @route   GET /api/dashboard/monthly-sales
// @desc    Get monthly sales data for chart (last 6-12 months)
// @access  Private
router.get('/monthly-sales', protect, async (req, res) => { // Use 'protect' directly here too
    try {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 5);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        const salesData = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'completed' } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalSales: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const result = [];
        let currentMonth = new Date(startDate);
        for (let i = 0; i < 6; i++) {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;

            const salesForMonth = salesData.find(d => d._id.year === year && d._id.month === month);
            const monthName = currentMonth.toLocaleString('en-US', { month: 'short' });

            result.push({
                month: monthName,
                sales: salesForMonth ? salesForMonth.totalSales : 0
            });

            currentMonth.setMonth(currentMonth.getMonth() + 1);
        }

        res.json(result);
    } catch (err) {
        console.error('Error fetching monthly sales:', err.message);
        res.status(500).json({ message: 'Server Error: Could not fetch monthly sales.' });
    }
});

module.exports = router;