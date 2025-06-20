// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true, // Username must be unique
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Email must be unique
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    mobileNumber: {
        type: String,
        required: true,
        unique: true, // Mobile number must be unique
        trim: true,
        minlength: 10,
        maxlength: 10 // Basic validation for 10-digit numbers
    },
    // No isVerified, verificationToken, verificationTokenExpires as email verification is skipped
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);