// backend/server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // For handling cross-origin requests

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Body parser for JSON data
app.use(cors()); // Enable CORS for all origins (adjust for production if needed)

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
    res.send('E-Commerce Analytics Backend API');
});

// Import and use auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes); // All auth routes will be prefixed with /api/auth

// Import and use dashboard routes
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes); // All dashboard routes will be prefixed with /api/dashboard

// Import and use inventory routes
const inventoryRoutes = require('./routes/inventoryRoutes');
app.use('/api/inventory', inventoryRoutes); // All inventory routes will be prefixed with /api/inventory

// Import and use sales routes (NEWLY ADDED FOR SALES)
const salesRoutes = require('./routes/salesRoutes');
app.use('/api/sales', salesRoutes); // All sales routes will be prefixed with /api/sales

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections (Good practice, often added after server.listen)
process.on('unhandledRejection', (err, promise) => {
    console.error(`Error: ${err.message}`);
    // You might want to gracefully close the server here in a real app
    // app.close(() => process.exit(1)); // If using http.Server directly
});