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
        expiresIn: '7d' // Token expires in 7 days (as per your original code)
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
            password, // Password will be hashed by the pre-save hook in the User model
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

        // Compare password using the method defined in your User model
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
router.get('/profile', protect, async (req, res) => {
    // req.user is populated by the protect middleware after verifying the JWT
    // Ensure we send back the full user object expected by the frontend
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});

// @desc    Update user profile (username, fullName, mobileNumber, email)
// @route   PUT /api/auth/update-profile
// @access  Private
router.put('/update-profile', protect, async (req, res) => {
    const { fullName, username, email, mobileNumber } = req.body;
    const userId = req.user.id; // User ID from the protect middleware

    try {
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check for duplicate username (if changed and belongs to another user)
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser && String(existingUser._id) !== String(userId)) {
                return res.status(400).json({ message: 'Username already taken by another user' });
            }
            user.username = username;
        }

        // Check for duplicate email (if changed and belongs to another user)
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && String(existingUser._id) !== String(userId)) {
                return res.status(400).json({ message: 'Email already registered by another user' });
            }
            user.email = email;
        }

        // Check for duplicate mobileNumber (if changed and belongs to another user)
        if (mobileNumber && mobileNumber !== user.mobileNumber) {
            const existingUser = await User.findOne({ mobileNumber });
            if (existingUser && String(existingUser._id) !== String(userId)) {
                return res.status(400).json({ message: 'Mobile number already registered by another user' });
            }
            user.mobileNumber = mobileNumber;
        }

        // Update other fields
        if (fullName) user.fullName = fullName;

        await user.save();

        res.json({
            message: 'Profile updated successfully!',
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            mobileNumber: user.mobileNumber,
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error during profile update' });
    }
});

// @desc    Update user password
// @route   PUT /api/auth/update-password
// @access  Private
router.put('/update-password', protect, async (req, res) => {
    const { newPassword } = req.body;
    const userId = req.user.id; // User ID from the protect middleware

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // User model's pre-save hook should handle hashing the new password
        user.password = newPassword; // The pre-save hook will hash this
        await user.save();

        res.json({ message: 'Password updated successfully!' });

    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ message: 'Server error during password update' });
    }
});


module.exports = router;