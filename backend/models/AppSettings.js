// backend/models/AppSettings.js
const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
    // User profile - Note: Basic profile fields are typically in the User model,
    // this can be for additional user-specific settings not related to auth.
    // For now, profile management (username/password) will usually go through the User model updates.

    // PDF Report Branding
    companyName: { type: String, default: 'BizSight Analytics' },
    companyLogoUrl: { type: String, default: '' }, // URL to a hosted logo image
    reportFooterText: { type: String, default: 'Generated by BizSight. All rights reserved.' },

    // Alert Threshold Settings
    lowStockThreshold: { type: Number, default: 10 }, // Quantity below which an alert is triggered
    dailySalesGoal: { type: Number, default: 5000 }, // Daily sales target in currency

    // Data Management (No direct fields here, but managed via API)
    // - Data Reset / Demo Mode: Will be an API endpoint
    // - Download Raw Data: Will be an API endpoint

    // User Theme (handled on frontend, but can be stored per user here)
    // theme: { type: String, enum: ['light', 'dark'], default: 'dark' }, // If you want per-user theme preference

    // Reference to the user this setting belongs to (if settings are per user)
    // For now, let's assume one global settings document or settings linked to an admin user.
    // If you want user-specific settings, you'd add:
    // user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
    // For simplicity, we'll start with a single, main settings document for now,
    // or link it to a specific admin if you plan for multiple admin users with different settings.
    // Let's make it a general application setting, possibly for an admin to manage.
    // We can use a fixed ID or assume only one such document exists.
}, { timestamps: true });

// Optional: Ensure only one settings document exists (or one per user, if you add the user field)
// This index will ensure that `user` field is unique. If `user` is null, it allows multiple nulls
// unless `unique: true` is combined with `sparse: false` (which would only allow one null).
// For a single global setting, we might not need a user field at all and just query for the single document.
// For now, let's just export the model. We'll handle uniqueness in the route logic if needed.

module.exports = mongoose.model('AppSettings', appSettingsSchema);