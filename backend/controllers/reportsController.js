// backend/controllers/reportsController.js
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const mongoose = require('mongoose'); // Import mongoose for ObjectId conversion

// Function to get category-wise sales data
const getCategorySales = async (req, res) => {
    try {
        const salesByCategories = await Sale.aggregate([
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            // Convert req.user.id to ObjectId for comparison
            { $match: { 'productDetails.user': new mongoose.Types.ObjectId(req.user.id) } },
            {
                $group: {
                    _id: '$productDetails.category',
                    totalRevenue: { $sum: '$items.priceAtSale' },
                    totalQuantity: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        res.status(200).json(salesByCategories);
    } catch (error) {
        console.error('Error fetching category sales:', error);
        res.status(500).json({ message: 'Error fetching category sales', error: error.message });
    }
};

// Function to get product-wise sales data
const getProductSales = async (req, res) => {
    try {
        const salesByProducts = await Sale.aggregate([
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            // Convert req.user.id to ObjectId for comparison
            { $match: { 'productDetails.user': new mongoose.Types.ObjectId(req.user.id) } },

            {
                $group: {
                    _id: '$productDetails._id',
                    productName: { $first: '$productDetails.name' },
                    totalRevenue: { $sum: '$items.priceAtSale' },
                    totalQuantity: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        res.status(200).json(salesByProducts);
    } catch (error) {
        console.error('Error fetching product sales:', error);
        res.status(500).json({ message: 'Error fetching product sales', error: error.message });
    }
};

// Function to get sales trends over time
const getSalesTrends = async (req, res) => {
    const { period, startDate, endDate } = req.query;

    let groupByFormat;
    // Base match query for the current user's sales, convert req.user.id to ObjectId
    let matchQuery = { user: new mongoose.Types.ObjectId(req.user.id) };

    if (period === 'day') {
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } };
    } else if (period === 'month') {
        groupByFormat = { $dateToString: { format: '%Y-%m', date: '$saleDate' } };
    } else if (period === 'year') {
        groupByFormat = { $dateToString: { format: '%Y', date: '$saleDate' } };
    } else if (period === 'week') {
        groupByFormat = {
            year: { $isoWeekYear: '$saleDate' },
            week: { $isoWeek: '$saleDate' }
        };
    } else if (period === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start) || isNaN(end) || start > end) {
            return res.status(400).json({ message: 'Invalid custom date range.' });
        }
        matchQuery.saleDate = { $gte: start, $lte: end };
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } };
    } else {
        groupByFormat = { $dateToString: { format: '%Y-%m', date: '$saleDate' } };
    }

    try {
        const salesTrends = await Sale.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: groupByFormat,
                    totalSales: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json(salesTrends);
    } catch (error) {
        console.error('Error fetching sales trends:', error);
        res.status(500).json({ message: 'Error fetching sales trends', error: error.message });
    }
};

// Function to get top/least selling products
const getTopLeastSellingProducts = async (req, res) => {
    const { limit = 5, type = 'top' } = req.query;
    const sortOrder = type === 'top' ? -1 : 1;

    try {
        const topLeastProducts = await Sale.aggregate([
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            // Convert req.user.id to ObjectId for comparison
            { $match: { 'productDetails.user': new mongoose.Types.ObjectId(req.user.id) } },
            {
                $group: {
                    _id: '$productDetails._id',
                    productName: { $first: '$productDetails.name' },
                    totalRevenue: { $sum: '$items.priceAtSale' },
                    totalQuantitySold: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalRevenue: sortOrder } },
            { $limit: parseInt(limit) }
        ]);

        res.status(200).json(topLeastProducts);
    } catch (error) {
        console.error('Error fetching top/least selling products:', error);
        res.status(500).json({ message: 'Error fetching top/least selling products', error: error.message });
    }
};

// Function to get real-time-like analytics (e.g., sales comparison for recent periods)
const getRealTimeAnalytics = async (req, res) => {
    try {
        const today = new Date();
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - 7);
        lastWeekStart.setHours(0, 0, 0, 0);

        const twoWeeksAgoStart = new Date(today);
        twoWeeksAgoStart.setDate(today.getDate() - 14);
        twoWeeksAgoStart.setHours(0, 0, 0, 0);

        const currentWeekSales = await Sale.aggregate([
            // Convert req.user.id to ObjectId for comparison
            { $match: { user: new mongoose.Types.ObjectId(req.user.id), saleDate: { $gte: lastWeekStart, $lte: today } } },
            { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
        ]);

        const previousWeekSales = await Sale.aggregate([
            // Convert req.user.id to ObjectId for comparison
            { $match: { user: new mongoose.Types.ObjectId(req.user.id), saleDate: { $gte: twoWeeksAgoStart, $lt: lastWeekStart } } },
            { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
        ]);

        const currentTotal = currentWeekSales.length > 0 ? currentWeekSales[0].totalSales : 0;
        const previousTotal = previousWeekSales.length > 0 ? previousWeekSales[0].totalSales : 0;

        let salesChangePercent = 0;
        let salesTrendMessage = 'Sales data available.';

        if (previousTotal > 0) {
            salesChangePercent = ((currentTotal - previousTotal) / previousTotal) * 100;
            salesTrendMessage = `Sales ${salesChangePercent >= 0 ? 'increased' : 'decreased'} by ${Math.abs(salesChangePercent).toFixed(2)}% compared to the previous week.`;
        } else if (currentTotal > 0) {
            salesTrendMessage = 'Sales occurred this week, but no sales in the previous week for comparison.';
        } else {
            salesTrendMessage = 'No sales data for the last two weeks.';
        }

        const currentWeekProductSales = await Sale.aggregate([
            // Convert req.user.id to ObjectId for comparison
            { $match: { user: new mongoose.Types.ObjectId(req.user.id), saleDate: { $gte: lastWeekStart, $lte: today } } },
            { $unwind: '$items' },
            { $group: { _id: '$items.product', productName: { $first: '$items.productName' }, totalQuantity: { $sum: '$items.quantity' } } }
        ]);

        const previousWeekProductSales = await Sale.aggregate([
            // Convert req.user.id to ObjectId for comparison
            { $match: { user: new mongoose.Types.ObjectId(req.user.id), saleDate: { $gte: twoWeeksAgoStart, $lt: lastWeekStart } } },
            { $unwind: '$items' },
            { $group: { _id: '$items.product', productName: { $first: '$items.productName' }, totalQuantity: { $sum: '$items.quantity' } } }
        ]);

        const trendingProducts = [];
        currentWeekProductSales.forEach(currentProduct => {
            const prevProduct = previousWeekProductSales.find(p => p._id.equals(currentProduct._id));
            if (prevProduct && currentProduct.totalQuantity > (prevProduct.totalQuantity * 1.5)) {
                trendingProducts.push({
                    productName: currentProduct.productName,
                    currentWeekQuantity: currentProduct.totalQuantity,
                    previousWeekQuantity: prevProduct.totalQuantity,
                    trend: `${(currentProduct.totalQuantity / prevProduct.totalQuantity).toFixed(1)}x increase`
                });
            } else if (!prevProduct && currentProduct.totalQuantity > 0) {
                trendingProducts.push({
                    productName: currentProduct.productName,
                    currentWeekQuantity: currentProduct.totalQuantity,
                    previousWeekQuantity: 0,
                    trend: `New high sales`
                });
            }
        });

        res.status(200).json({
            salesChangePercent: salesChangePercent.toFixed(2),
            salesTrendMessage,
            trendingProducts
        });

    } catch (error) {
        console.error('Error fetching real-time analytics:', error);
        res.status(500).json({ message: 'Error fetching real-time analytics', error: error.message });
    }
};

// Function to get daily sales progress (relative to a potential goal)
const getDailySalesProgress = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const dailySales = await Sale.aggregate([
            // Convert req.user.id to ObjectId for comparison
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.user.id),
                    saleDate: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSalesToday: { $sum: '$totalAmount' },
                    totalQuantitySoldToday: { $sum: { $sum: '$items.quantity' } }
                }
            }
        ]);

        const totalSalesToday = dailySales.length > 0 ? dailySales[0].totalSalesToday : 0;
        const totalQuantitySoldToday = dailySales.length > 0 ? dailySales[0].totalQuantitySoldToday : 0;

        res.status(200).json({ totalSalesToday, totalQuantitySoldToday });
    } catch (error) {
        console.error('Error fetching daily sales progress:', error);
        res.status(500).json({ message: 'Error fetching daily sales progress', error: error.message });
    }
};


module.exports = {
    getCategorySales,
    getProductSales,
    getSalesTrends,
    getTopLeastSellingProducts,
    getRealTimeAnalytics,
    getDailySalesProgress
};