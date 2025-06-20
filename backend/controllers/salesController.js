// backend/controllers/salesController.js
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// @desc    Get all sales for the authenticated user
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res) => {
    try {
        const sales = await Sale.find({ user: req.user.id }).populate('items.product'); // Populate product details
        res.json(sales);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Record a new manual sale
// @route   POST /api/sales/manual-entry
// @access  Private
const recordManualSale = async (req, res) => {
    const { productId, quantity, saleDate } = req.body;

    if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Product ID and a positive quantity are required.' });
    }

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Ensure product belongs to the user
        if (product.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Product does not belong to your inventory.' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}.` });
        }

        // Create sale item
        const saleItem = {
            product: product._id,
            productName: product.name,
            quantity: quantity,
            priceAtSale: product.price,
            subtotal: quantity * product.price
        };

        const totalAmount = saleItem.subtotal;

        const newSale = new Sale({
            user: req.user.id,
            items: [saleItem],
            totalAmount: totalAmount,
            saleDate: saleDate ? new Date(saleDate) : Date.now()
        });

        await newSale.save();

        // Update product stock
        product.stock -= quantity;
        await product.save();

        res.status(201).json({ message: 'Sale recorded successfully!', sale: newSale });

    } catch (err) {
        console.error('Error recording manual sale:', err.message);
        res.status(500).send('Server Error');
    }
};


// @desc    Upload sales data via CSV
// @route   POST /api/sales/upload
// @access  Private
const uploadSalesCsv = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const filePath = path.join(__dirname, '..', req.file.path);
    const salesToProcess = [];
    const initialParseErrors = [];
    let successfulSalesCount = 0;
    const salesProcessingErrors = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            if (!row.productName || !row.quantity) {
                initialParseErrors.push({ row, message: 'Missing productName or quantity in CSV row.' });
                return;
            }
            salesToProcess.push(row);
        })
        .on('end', async () => {
            fs.unlink(filePath, (err) => { // Clean up the uploaded file
                if (err) console.error('Error deleting temporary file:', err);
            });

            if (initialParseErrors.length > 0) {
                return res.status(400).json({
                    message: `CSV parsing complete with ${initialParseErrors.length} initial errors.`,
                    details: { initialParseErrors, failedSalesCount: initialParseErrors.length, successfulSalesCount: 0 }
                });
            }

            for (const saleData of salesToProcess) {
                const { productName, quantity, priceAtSale, saleDate } = saleData;
                const qty = parseInt(quantity, 10);
                const parsedPriceAtSale = parseFloat(priceAtSale);
                const parsedSaleDate = saleDate ? new Date(saleDate) : Date.now();

                // Validate parsed data
                if (isNaN(qty) || qty <= 0) {
                    salesProcessingErrors.push({ row: saleData, message: 'Invalid quantity.' });
                    continue;
                }

                try {
                    // Find the product by name for the current user
                    const product = await Product.findOne({ name: productName, user: req.user.id });

                    if (!product) {
                        salesProcessingErrors.push({ row: saleData, message: `Product "${productName}" not found in your inventory.` });
                        continue;
                    }

                    if (product.stock < qty) {
                        salesProcessingErrors.push({ row: saleData, message: `Insufficient stock for "${productName}". Available: ${product.stock}, Requested: ${qty}.` });
                        continue;
                    }

                    // Determine price at sale
                    const finalPriceAtSale = isNaN(parsedPriceAtSale) ? product.price : parsedPriceAtSale;

                    // Create sale item
                    const saleItem = {
                        product: product._id,
                        productName: product.name,
                        quantity: qty,
                        priceAtSale: finalPriceAtSale,
                        subtotal: qty * finalPriceAtSale
                    };

                    const totalAmount = saleItem.subtotal;

                    const newSale = new Sale({
                        user: req.user.id,
                        items: [saleItem], // Each row in CSV is treated as a single-item sale for simplicity
                        totalAmount: totalAmount,
                        saleDate: parsedSaleDate
                    });

                    await newSale.save();

                    // Update product stock
                    product.stock -= qty;
                    await product.save();
                    successfulSalesCount++;

                } catch (error) {
                    console.error(`Error processing sales row for product "${productName}":`, error.message);
                    salesProcessingErrors.push({ row: saleData, message: error.message });
                }
            }

            if (salesProcessingErrors.length > 0) {
                return res.status(207).json({ // 207 Multi-Status
                    message: `Sales CSV processed. ${successfulSalesCount} sales recorded, ${salesProcessingErrors.length} failed.`,
                    details: {
                        successfulSalesCount,
                        failedSalesCount: salesProcessingErrors.length,
                        salesProcessingErrors
                    }
                });
            }

            res.status(200).json({
                message: `${successfulSalesCount} sales recorded successfully from CSV!`,
                details: { successfulSalesCount }
            });

        })
        .on('error', (err) => {
            console.error('CSV Read Stream Error:', err);
            res.status(500).json({ message: 'Error reading CSV file.', details: err.message });
        });
};


module.exports = {
    getSales,
    recordManualSale,
    uploadSalesCsv
};