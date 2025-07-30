const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        trim: true,
        required: [true, 'Coupon code is required'],
        unique: [true, 'Coupon code must be unique'],
    },
    expiresAt: {
        type: Date,
        required: [true, 'Coupon expiration date is required'],
    },
    discount: {
        type: Number,
        required: [true, 'Coupon discount is required'],
    },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);