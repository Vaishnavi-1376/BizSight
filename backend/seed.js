// backend/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Order = require('./models/Order');

const productsData = [
    { name: 'Gaming Laptop', price: 1500.00, stock: 30 },
    { name: 'Mechanical Keyboard', price: 120.00, stock: 15 },
    { name: 'Wireless Mouse', price: 50.00, stock: 5 }, // Low stock
    { name: '4K Monitor', price: 400.00, stock: 20 },
    { name: 'Webcam 1080p', price: 75.00, stock: 0 } // Out of stock
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for seeding!');

        await Product.deleteMany({}); // Clear existing products
        await Order.deleteMany({});   // Clear existing orders
        console.log('Existing data cleared.');

        const insertedProducts = await Product.insertMany(productsData);
        console.log('Products seeded!');

        // Get IDs of seeded products for orders
        const gamingLaptopId = insertedProducts.find(p => p.name === 'Gaming Laptop')?._id;
        const wirelessMouseId = insertedProducts.find(p => p.name === 'Wireless Mouse')?._id;
        const mechanicalKeyboardId = insertedProducts.find(p => p.name === 'Mechanical Keyboard')?._id;
        const fourKMonitorId = insertedProducts.find(p => p.name === '4K Monitor')?._id;

        // Ensure we have product IDs before creating orders
        if (!gamingLaptopId || !wirelessMouseId || !mechanicalKeyboardId || !fourKMonitorId) {
            console.error('Could not find all product IDs for seeding orders. Check product names in seed.js.');
            // Do not proceed with order seeding if products are not found
            return;
        }

        // --- Generate Orders with Dates for Charts ---
        const today = new Date();
        today.setHours(10, 0, 0, 0); // 10:00 AM today (June 20, 2025)

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1); // June 19, 2025
        yesterday.setHours(14, 0, 0, 0);

        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2); // June 18, 2025
        twoDaysAgo.setHours(9, 0, 0, 0);

        const fourDaysAgo = new Date(today);
        fourDaysAgo.setDate(today.getDate() - 4); // June 16, 2025
        fourDaysAgo.setHours(11, 0, 0, 0);

        const aMonthAgo = new Date(today);
        aMonthAgo.setMonth(today.getMonth() - 1); // May 20, 2025
        aMonthAgo.setHours(16, 0, 0, 0);

        const twoMonthsAgo = new Date(today);
        twoMonthsAgo.setMonth(today.getMonth() - 2); // April 20, 2025
        twoMonthsAgo.setHours(12, 0, 0, 0);

        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3); // March 20, 2025
        threeMonthsAgo.setHours(13, 0, 0, 0);


        const ordersData = [
            // Orders for Weekly Chart (last 7 days)
            {
                products: [{ productId: gamingLaptopId, quantity: 1, priceAtSale: 1500.00 }],
                totalAmount: 1500.00,
                status: 'completed',
                createdAt: today
            },
            {
                products: [{ productId: wirelessMouseId, quantity: 2, priceAtSale: 50.00 }],
                totalAmount: 100.00,
                status: 'completed',
                createdAt: today
            },
            {
                products: [{ productId: mechanicalKeyboardId, quantity: 1, priceAtSale: 120.00 }],
                totalAmount: 120.00,
                status: 'completed',
                createdAt: yesterday
            },
            {
                products: [{ productId: gamingLaptopId, quantity: 1, priceAtSale: 1500.00 }],
                totalAmount: 1500.00,
                status: 'completed',
                createdAt: twoDaysAgo
            },
            {
                products: [{ productId: fourKMonitorId, quantity: 1, priceAtSale: 400.00 }],
                totalAmount: 400.00,
                status: 'completed',
                createdAt: fourDaysAgo
            },

            // Orders for Monthly Chart (older data)
            {
                products: [{ productId: gamingLaptopId, quantity: 1, priceAtSale: 1500.00 }],
                totalAmount: 1500.00,
                status: 'completed',
                createdAt: aMonthAgo
            },
            {
                products: [{ productId: wirelessMouseId, quantity: 3, priceAtSale: 50.00 }],
                totalAmount: 150.00,
                status: 'completed',
                createdAt: aMonthAgo
            },
            {
                products: [{ productId: mechanicalKeyboardId, quantity: 1, priceAtSale: 120.00 }],
                totalAmount: 120.00,
                status: 'completed',
                createdAt: twoMonthsAgo
            },
             {
                products: [{ productId: fourKMonitorId, quantity: 2, priceAtSale: 400.00 }],
                totalAmount: 800.00,
                status: 'completed',
                createdAt: threeMonthsAgo
            }
        ];

        await Order.insertMany(ordersData);
        console.log('Orders seeded!');

        console.log('Database seeding complete!');
    } catch (err) {
        console.error('Database seeding failed:', err);
        process.exit(1); // Exit with an error code
    } finally {
        mongoose.disconnect(); // Disconnect after seeding
    }
};

seedDB();