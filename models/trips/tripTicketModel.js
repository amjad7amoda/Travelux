const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config();
const Trip = require("./tripModel");
const User = require("../userModel");

const tripTicketSchema = new mongoose.Schema({
    trip: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    numberOfPassengers: {
        type: Number,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['valid', 'expired', 'cancelled'],
        default: 'valid',
    },
    // payment status
    paymentStatus:{
        type: String,
        enum: ['pending_payment', 'paid', 'failed'],
        default: 'pending_payment'
    }
});

const TripTicket = mongoose.model('TripTicket', tripTicketSchema);

module.exports = TripTicket;