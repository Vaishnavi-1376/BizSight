// backend/routes/settings.js
const express = require('express');
const router = express.Router();
const AppSettings = require('../models/AppSettings');
const User = require('../models/User'); // Assuming you have a User model for authentication
const Product = require('../models/Product'); // CORRECTED: For data reset (was Inventory)
const Sale = require('../models/Sale');     // CORRECTED: For data reset (was Sales)
const { protect } = require('../middleware/authMiddleware'); // Assuming you use 'authMiddleware' and named export 'protect'

// Helper function to create/get settings
const getOrCreateSettings = async () => {
    let settings = await AppSettings.findOne();
    if (!settings) {
        settings = new AppSettings();
        await settings.save();
    }
    return settings;
};

// @route   GET api/settings
// @desc    Get application settings
// @access  Private (Admin or Authenticated User)
router.get('/', protect, async (req, res) => { // Using 'protect' middleware
    try {
        const settings = await getOrCreateSettings();
        res.json(settings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/settings
// @desc    Update application settings
// @access  Private (Admin only, or if you make settings per user, then private for that user)
// For simplicity, let's assume only an admin can update these global settings for now.
router.put('/', protect, async (req, res) => { // Using 'protect' middleware
    // In a real app, you'd check if req.user.role is 'admin'
    // if (req.user.role !== 'admin') {
    //     return res.status(403).json({ msg: 'Authorization denied, admin only' });
    // }

    const { companyName, companyLogoUrl, reportFooterText, lowStockThreshold, dailySalesGoal } = req.body;

    try {
        let settings = await getOrCreateSettings();

        // Update fields if they are provided in the request body
        if (companyName !== undefined) settings.companyName = companyName;
        if (companyLogoUrl !== undefined) settings.companyLogoUrl = companyLogoUrl;
        if (reportFooterText !== undefined) settings.reportFooterText = reportFooterText;
        if (lowStockThreshold !== undefined) settings.lowStockThreshold = lowStockThreshold;
        if (dailySalesGoal !== undefined) settings.dailySalesGoal = dailySalesGoal;

        await settings.save();
        res.json(settings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/settings/reset-data
// @desc    Reset all product and sales data (for demo mode/testing)
// @access  Private (Admin only - VERY DANGEROUS)
router.post('/reset-data', protect, async (req, res) => { // Using 'protect' middleware
    // Strongly recommend adding a role check here for 'admin'
    // if (req.user.role !== 'admin') {
    //     return res.status(403).json({ msg: 'Authorization denied, admin only' });
    // }

    try {
        await Product.deleteMany({}); // CORRECTED: Delete all product items
        await Sale.deleteMany({});    // CORRECTED: Delete all sales records
        res.json({ msg: 'All product and sales data reset successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/settings/download-raw-data
// @desc    Download raw product and sales data as CSV
// @access  Private (Admin only)
router.get('/download-raw-data', protect, async (req, res) => { // Using 'protect' middleware
    // Strongly recommend adding a role check here for 'admin'
    // if (req.user.role !== 'admin') {
    //     return res.status(403).json({ msg: 'Authorization denied, admin only' });
    // }

    try {
        const productData = await Product.find().lean(); // .lean() for plain JS objects
        const salesData = await Sale.find().lean(); // Using 'Sale' model

        // Basic CSV conversion for demonstration. For production, consider 'csv-stringify' package.
        const productCsv = productData.length > 0
            ? "name,price,stock,category\n" + // Updated headers based on Product model
              productData.map(item =>
                  `${item.name || ''},${item.price || 0},${item.stock || 0},${item.category || ''}`
              ).join('\n')
            : "No product data.";

        const salesCsv = salesData.length > 0
            ? "totalAmount,saleDate,items\n" + // Updated headers based on Sale model
              salesData.map(sale =>
                  `${sale.totalAmount || 0},${sale.saleDate ? sale.saleDate.toISOString() : ''},"${sale.items.map(item => `${item.productName} (Qty: ${item.quantity}, Price: ${item.priceAtSale})`).join('; ')}"` // Simplified items representation
              ).join('\n')
            : "No sales data.";

        res.status(200).json({
            message: 'Raw data prepared. In a real application, this would trigger a file download.',
            productCsv: productCsv.slice(0, 500) + '...', // Show truncated preview
            salesCsv: salesCsv.slice(0, 500) + '...'
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;