// backend/models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    // If you want to link orders to users, you can add:
    // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    products: [ // This array will hold the details of products sold in this order
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true, min: 1 },
            priceAtSale: { type: Number, required: true, min: 0 } // Price when the item was sold
        }
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed' },
}, { timestamps: true }); // This adds 'createdAt' and 'updatedAt' fields automatically

module.exports = mongoose.model('Order', OrderSchema);