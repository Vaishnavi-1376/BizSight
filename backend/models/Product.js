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

// IMPORTANT: Add a compound unique index to ensure name is unique PER USER
// This means user A can have "Laptop", and user B can also have "Laptop".
// If you truly want product names unique across ALL users, keep `unique: true` on 'name'
// and remove this compound index.
ProductSchema.index({ name: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Product', ProductSchema);