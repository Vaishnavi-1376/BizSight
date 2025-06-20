// backend/models/Sale.js
const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // References the Product model
        required: true,
    },
    productName: { // Storing name directly for historical accuracy if product name changes later
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    priceAtSale: { // Price at the time of sale, in case product price changes later
        type: Number,
        required: true,
        min: 0,
    },
    subtotal: { // quantity * priceAtSale
        type: Number,
        required: true,
        min: 0,
    }
}, { _id: false }); // Do not create an _id for subdocuments (SaleItem)

const SaleSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User who made the sale (if applicable, or the user recording it)
        required: true,
    },
    items: [SaleItemSchema], // Array of products sold in this transaction
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    saleDate: { // Can be explicitly set by user for historical records
        type: Date,
        default: Date.now,
    }
    // REMOVED 'channel' field here
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

module.exports = mongoose.model('Sale', SaleSchema);