// backend/models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        // unique: true, // REMOVE this if you use the compound index below
        trim: true,
        maxlength: [100, 'Name can not be more than 100 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price must be a positive number']
    },
    stock: {
        type: Number,
        required: [true, 'Stock is required'],
        min: [0, 'Stock cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Product category is required'],
        trim: true,
        enum: ['Food', 'Clothes', 'Electronics', 'Books', 'Home Goods', 'Sports', 'Other'],
        default: 'Other'
    },
    user: { // The user who added/managed this product - This is correct based on your model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});


ProductSchema.index({ name: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Product', ProductSchema);