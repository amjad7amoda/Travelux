const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    items: [{
        bookingType: {
            type: String,
            enum: ['FlightTicket', 'CarBooking', 'Booking', 'TrainTripBooking', 'TripTicket'],
            required: [true, 'Booking type is required']
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Booking ID is required'],
            refPath: 'items.bookingType'
        },
        price: Number,
        quantity: Number
    }],
    totalPrice: {
        type: Number,
        default: 0
    },
    coupons: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],
        default: []
    }, 
    totalPriceAfterDiscount: {
        type: Number,
        default: 0
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    status: {
        type: String,
        enum: ['completed', 'continous']
    },
    paidAt: {
        type: Date
    }
});

module.exports = mongoose.model('Bill', billSchema);