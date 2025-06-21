// backend/routes/reportsRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const reportsController = require('../controllers/reportsController');

// Define the route for fetching category sales.
router.get('/category-sales', protect, reportsController.getCategorySales);

// Product-wise sales breakdown
router.get('/product-sales', protect, reportsController.getProductSales);

// Sales trends over time
router.get('/sales-trends', protect, reportsController.getSalesTrends);

// Top/Least selling products
router.get('/top-least-selling', protect, reportsController.getTopLeastSellingProducts);

// Real-time analytics (sales comparison)
router.get('/realtime-analytics', protect, reportsController.getRealTimeAnalytics);

// Daily sales progress/goals
router.get('/daily-sales-progress', protect, reportsController.getDailySalesProgress);


module.exports = router;