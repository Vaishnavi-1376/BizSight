// backend/routes/salesRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');

// --- IMPORTANT: Import your controller and middleware ---
const salesController = require('../controllers/salesController');
const { protect } = require('../middleware/authMiddleware'); // Assuming authMiddleware exports 'protect'

// --- Multer Configuration for sales (make it consistent with inventory's robust setup) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this directory exists!
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limit file size to 5MB, adjust as needed
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed!'), false);
        }
    }
});

// --- Custom error handling middleware for Multer (Copy from inventoryRoutes.js) ---
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer error (Sales Upload):', err.message);
        return res.status(400).json({ message: `File upload error: ${err.message}` });
    } else if (err) {
        console.error('Unknown upload error (Sales Upload):', err.message);
        return res.status(400).json({ message: `An unexpected file upload error occurred: ${err.message}` });
    }
    next();
};

// @route   GET /api/sales
// @desc    Get all sales for the logged-in user
// @access  Private
router.get('/', protect, salesController.getSales);

// @route   POST /api/sales/manual-entry
// @desc    Record a single new sale manually
// @access  Private
router.post('/manual-entry', protect, salesController.recordManualSale);

// @route   POST /api/sales/upload
// @desc    Upload CSV file to record multiple sales
// @access  Private
// Make sure the 'name' attribute of your file input in frontend is 'salesFile'
router.post(
    '/upload',
    protect, // Authenticates the user first
    upload.single('salesFile'), // Multer middleware processes the file
    handleMulterError, // <--- ADD THIS HERE! Custom error handler for Multer errors
    salesController.uploadSalesCsv // Your controller logic to process the CSV
);

module.exports = router;