// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
// No email verification, so no need for crypto or emailSender utility
// const crypto = require('crypto');
// const { sendVerificationEmail } = require('../utils/emailSender');

// --- THE KEY CHANGE IS HERE ---
const { protect } = require('../middleware/authMiddleware'); // <-- Corrected to use named destructuring

// Helper to generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d' // Token expires in 1 hour
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    // Extract new fields: fullName, username, mobileNumber
    const { fullName, username, email, password, mobileNumber } = req.body;

    // Basic validation
    if (!fullName || !username || !email || !password || !mobileNumber) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // Check if username, email, or mobileNumber already exists
        const userExistsByEmail = await User.findOne({ email });
        if (userExistsByEmail) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        const userExistsByUsername = await User.findOne({ username });
        if (userExistsByUsername) {
            return res.status(400).json({ message: 'Username already taken' });
        }
        const userExistsByMobile = await User.findOne({ mobileNumber });
        if (userExistsByMobile) {
            return res.status(400).json({ message: 'Mobile number already registered' });
        }

        // Create the user (no email verification related fields)
        const user = await User.create({
            fullName,
            username,
            email,
            password,
            mobileNumber,
            // User is implicitly verified as there's no email step
        });

        // Immediately generate and send token upon successful registration
        res.status(201).json({
            message: 'Registration successful! You can now log in.',
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            mobileNumber: user.mobileNumber,
            token: generateToken(user._id) // User gets token right away
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});


// @desc    Authenticate user & get token (Login via username)
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    // Login using username
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // Find user by username
        const user = await User.findOne({ username: username.toLowerCase() });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials (username not found)' });
        }

        // Compare password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials (password incorrect)' });
        }

        // If credentials are valid, send user data and token
        res.json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            mobileNumber: user.mobileNumber,
            token: generateToken(user._id),
            // No isVerified field needed for frontend now
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @desc    Get user profile (protected route example)
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, (req, res) => { // This line (119) should now be correct
    // req.user is populated by the protect middleware after verifying the JWT
    res.json(req.user);
});

module.exports = router;