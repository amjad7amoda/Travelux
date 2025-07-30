const mongoose = require('mongoose');

const trainTripBookingSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    trainTrip: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TrainTrip',
        required: true
    },
    numOfSeats: {
        type: Number,
        required: true
    },
    bookingDate: {
        type: Date,
        required: true
    },
    totalPrice: {
        type: Number,
        min: 0,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending_payment', 'paid', 'failed'],
        default: 'pending_payment'
    },
    startStation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station',
        required: true
    },
    endStation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station',
        required: true
    },
    platform:{
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    estimatedTime: {
        type: Number,
        required: true
    },
    estimatedTimeStr: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'completed'],
        default: 'active'
    },
    departureTime: {
        type: Date,
        required: true
    },
    arrivalTime: {
        type: Date,
        required: true
    },

}, { timestamps: true });

module.exports = mongoose.model('TrainTripBooking', trainTripBookingSchema);