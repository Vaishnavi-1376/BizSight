// backend/routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');

// --- IMPORTANT: Import your controller and middleware ---
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware'); // Assuming authMiddleware exports 'protect'

// Set up multer for file uploads
// Configure disk storage for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure the 'uploads/' directory exists in your backend root
        // If it doesn't, Multer will throw an error or the file won't be saved.
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Use a unique filename to prevent clashes
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage, // Use the configured storage
    limits: {
        fileSize: 5 * 1024 * 1024 // Limit file size to 5MB (5 * 1024 * 1024 bytes). Adjust as needed.
    },
    fileFilter: (req, file, cb) => {
        // Accept only CSV file types
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true); // Accept the file
        } else {
            // Reject the file and provide an error message
            cb(new Error('Only CSV files are allowed!'), false);
        }
    }
});

// Custom error handling middleware for Multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        console.error('Multer error:', err.message);
        // Respond with a 400 Bad Request and the Multer error message
        return res.status(400).json({ message: `File upload error: ${err.message}` });
    } else if (err) {
        // An unknown error occurred (e.g., from fileFilter)
        console.error('Unknown upload error:', err.message);
        // Respond with a 400 Bad Request and the custom error message
        return res.status(400).json({ message: `An unexpected file upload error occurred: ${err.message}` });
    }
    // If no Multer error, proceed to the next middleware/controller
    next();
};

// @route   GET /api/inventory
// @desc    Get all products for the logged-in user
// @access  Private
router.get('/', protect, inventoryController.getInventory);

// @route   POST /api/inventory
// @desc    Add a new product
// @access  Private
router.post('/', protect, inventoryController.addProduct);

// @route   PUT /api/inventory/:id
// @desc    Update a product by ID
// @access  Private
router.put('/:id', protect, inventoryController.updateProduct);

// @route   DELETE /api/inventory/:id
// @desc    Delete a product by ID
// @access  Private
router.delete('/:id', protect, inventoryController.deleteProduct);

// @route   POST /api/inventory/upload-csv
// @desc    Upload CSV file to add/update multiple products
// @access  Private
// Make sure the 'name' attribute of your file input in frontend is 'productsFile'
router.post(
    '/upload-csv',
    protect, // Authenticates the user first
    upload.single('productsFile'), // Multer middleware processes the file
    handleMulterError, // Custom error handler specifically for Multer errors
    inventoryController.uploadInventoryCsv // Your controller logic to process the CSV
);

module.exports = router;