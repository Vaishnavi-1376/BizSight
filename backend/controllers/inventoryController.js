// backend/controllers/inventoryController.js
const Product = require('../models/Product');
const User = require('../models/User'); // User model is included but not directly used in these functions
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Helper to delete the temporary file uploaded by Multer
const deleteTempFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) console.error(`Error deleting temporary file: ${filePath}`, err);
    });
};

// @desc    Get all inventory items for the authenticated user
// @route   GET /api/inventory
// @access  Private
const getInventory = async (req, res) => {
    try {
        // Query products belonging to the logged-in user (using 'user' field as per your schema)
        const products = await Product.find({ user: req.user.id });
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Add a new inventory item
// @route   POST /api/inventory
// @access  Private
const addProduct = async (req, res) => {
    const { name, price, stock, category } = req.body;

    // Basic validation
    if (!name || price === undefined || stock === undefined || !category) {
        return res.status(400).json({ message: 'Please enter all fields: name, price, stock, and category.' });
    }

    try {
        // Check if product with this name already exists for THIS user
        let product = await Product.findOne({ name, user: req.user.id });
        if (product) {
            return res.status(400).json({ message: 'Product with this name already exists for your inventory.' });
        }

        // Create new product, associating it with the logged-in user
        product = new Product({
            name,
            price: parseFloat(price), // Ensure price is a number
            stock: parseInt(stock, 10), // Ensure stock is an integer
            category,
            user: req.user.id // Assign to the 'user' field as per your schema
        });

        await product.save();
        res.status(201).json({ message: 'Product added successfully!', product });
    } catch (err) {
        console.error(err.message);
        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: 'Validation Error', errors: messages });
        }
        // Handle duplicate key error (if the compound index on name and user is hit)
        if (err.code === 11000) {
            return res.status(400).json({ message: 'A product with this name already exists for this user.' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Update an inventory item
// @route   PUT /api/inventory/:id
// @access  Private
const updateProduct = async (req, res) => {
    const { name, price, stock, category } = req.body;

    const productFields = {};
    if (name) productFields.name = name;
    if (price !== undefined) productFields.price = parseFloat(price);
    if (stock !== undefined) productFields.stock = parseInt(stock, 10);
    if (category) productFields.category = category;

    try {
        let product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Ensure user is authorized to update THIS product (check against 'user' field)
        if (product.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized to update this product.' });
        }

        // If the name is being changed, check if the new name already exists for THIS user
        if (name && name !== product.name) {
            const existingProductWithName = await Product.findOne({ name: name, user: req.user.id });
            if (existingProductWithName) {
                return res.status(400).json({ message: 'Another product with this name already exists for your inventory.' });
            }
        }

        // Update the product, running schema validators
        product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: productFields },
            { new: true, runValidators: true }
        );

        res.json({ message: 'Product updated successfully!', product });
    } catch (err) {
        console.error(err.message);
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Product not found with the provided ID.' });
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: 'Validation Error', errors: messages });
        }
        if (err.code === 11000) {
            return res.status(400).json({ message: 'A product with this name already exists for this user.' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Delete an inventory item
// @route   DELETE /api/inventory/:id
// @access  Private
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Ensure user is authorized to delete THIS product (check against 'user' field)
        if (product.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized to delete this product.' });
        }

        await Product.findByIdAndDelete(req.params.id);

        res.json({ message: 'Product removed successfully!' });
    } catch (err) {
        console.error(err.message);
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Product not found with the provided ID.' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Upload inventory items via CSV
// @route   POST /api/inventory/upload-csv
// @access  Private
const uploadInventoryCsv = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded or file is not a valid CSV.' });
    }

    const filePath = req.file.path; // Multer provides the direct path to the saved temp file

    const productsToProcess = [];
    const initialParseErrors = []; // Errors detected during initial CSV data extraction
    let processedCount = 0;

    try {
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv({
                    mapHeaders: ({ header, index }) => {
                        const normalizedHeader = header.toLowerCase().trim();

                        // Prefer explicit header names if they exist in the CSV
                        if (normalizedHeader === 'productname' || normalizedHeader === 'name') return 'name';
                        if (normalizedHeader === 'price') return 'price';
                        if (normalizedHeader === 'stock') return 'stock';
                        if (normalizedHeader === 'category') return 'category';

                        // Fallback/Guessing if headers are not clear.
                        // This is a LAST RESORT and will only work if your CSV structure is consistent
                        // and doesn't have a proper header row.
                        // Based on the error you provided earlier:
                        // {120: '200', 6500: '2000', mechanical keyboard: 'Wireless Mouse', electronics: 'Electronics'}
                        // This implied that `mechanical keyboard` was the actual product name and `electronics` was the category.
                        // The numerical keys `120` and `6500` were likely the price and stock.
                        // If your CSV truly does not have a header row and the data starts immediately,
                        // `csv-parser` might use the first row's values as headers.
                        // The MOST RELIABLE way is to ensure your CSV has a proper header row.
                        if (index === 0) return 'name'; // Guessing the first column is name
                        if (index === 1) return 'price'; // Guessing the second column is price
                        if (index === 2) return 'stock'; // Guessing the third column is stock
                        if (index === 3) return 'category'; // Guessing the fourth column is category

                        return normalizedHeader; // Default for others if any
                    }
                }))
                .on('data', (row) => {
                    // Basic validation of CSV row data
                    // Use 'row.name' because mapHeaders should have converted 'productName' or guessed it to 'name'
                    if (!row.name || row.price === undefined || row.stock === undefined || !row.category) {
                        initialParseErrors.push({ row, message: 'Missing required fields (name, price, stock, category).' });
                        return;
                    }

                    const parsedPrice = parseFloat(row.price);
                    const parsedStock = parseInt(row.stock, 10);

                    if (isNaN(parsedPrice) || parsedPrice < 0) {
                        initialParseErrors.push({ row, message: 'Invalid price. Must be a non-negative number.' });
                        return;
                    }
                    if (isNaN(parsedStock) || parsedStock < 0) {
                        initialParseErrors.push({ row, message: 'Invalid stock. Must be a non-negative integer.' });
                        return;
                    }

                    const validCategories = ['Food', 'Clothes', 'Electronics', 'Books', 'Home Goods', 'Sports', 'Other'];
                    if (!validCategories.includes(row.category)) {
                        initialParseErrors.push({ row, message: `Invalid category: "${row.category}". Must be one of: ${validCategories.join(', ')}.` });
                        return;
                    }

                    productsToProcess.push({
                        name: row.name,
                        price: parsedPrice,
                        stock: parsedStock,
                        category: row.category
                    });
                })
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        // Delete the temporary file immediately after parsing the CSV
        deleteTempFile(filePath);

        if (initialParseErrors.length > 0) {
            // If there are initial parsing errors, respond with 400 and details
            return res.status(400).json({
                message: `CSV parsing completed with errors. ${initialParseErrors.length} rows were skipped or invalid.`,
                details: { initialParseErrors, processedCount: 0, failedCount: initialParseErrors.length }
            });
        }

        const productProcessingErrors = [];

        for (const productData of productsToProcess) {
            const { name, price, stock, category } = productData;

            try {
                // Find existing product by name and THIS user (using 'user' field)
                let product = await Product.findOne({ name, user: req.user.id });

                if (product) {
                    // Update existing product
                    product.price = price;
                    product.stock = stock;
                    product.category = category;
                    await product.save(); // Mongoose will run validators on save
                    processedCount++;
                } else {
                    // Add new product, associating it with THIS user
                    product = new Product({
                        name,
                        price,
                        stock,
                        category,
                        user: req.user.id // Assign to 'user' field as per your schema
                    });
                    await product.save();
                    processedCount++;
                }
            } catch (error) {
                console.error(`Error processing product "${name}" for user ${req.user.id}:`, error.message);
                productProcessingErrors.push({ row: productData, message: error.message });
            }
        }

        if (productProcessingErrors.length > 0) {
            // Respond with 207 Multi-Status if some items succeeded and some failed
            return res.status(207).json({
                message: `CSV processed. ${processedCount} products successfully added/updated, but ${productProcessingErrors.length} failed.`,
                details: {
                    processedCount,
                    failedCount: productProcessingErrors.length,
                    productProcessingErrors
                }
            });
        }

        // Full success response
        res.status(200).json({
            message: `${processedCount} products processed successfully from CSV!`,
            details: { processedCount }
        });

    } catch (err) {
        // Catch errors from the CSV stream itself or initial file operations
        deleteTempFile(filePath); // Ensure the temporary file is cleaned up even on stream errors
        console.error('Server error during CSV upload:', err);
        res.status(500).json({ message: 'Server error during CSV processing.', error: err.message });
    }
};

module.exports = {
    getInventory,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadInventoryCsv
};