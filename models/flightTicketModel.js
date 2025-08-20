const mongoose = require('mongoose');

const flightTicketSchema = new mongoose.Schema({
    outboundFlight: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight',
        required: true
    },
    returnFlight: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight',
        required: true
    },
    bookedSeats: [{
        seatNumber: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['business', 'economy'],
            required: true
        }
    }],
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
    },
    finalPrice: {
        type: Number,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    airline: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airline',
        required: true,
        select: 'name logo _id'
    },
    // payment status
    paymentStatus:{
        type: String,
        enum: ['pending_payment', 'paid', 'failed'],
        default: 'pending_payment'
    }
}, { timestamps: true });

// populate the outboundFlight and returnFlight
flightTicketSchema.pre('find', function(next) {

    if(this.options.skip) {
        return next();
    }
    
    this.populate({
        path: 'outboundFlight',
        select: 'departureDate arrivalDate departureAirport arrivalAirport duration _id'
    }).populate({
        path: 'returnFlight',
        select: 'departureDate arrivalDate departureAirport arrivalAirport duration _id'
    });
    // populate user
    this.populate({
        path: 'user',
        select: 'firstName lastName'
    })
    next();
});

const FlightTicket = mongoose.model('FlightTicket', flightTicketSchema);

module.exports = FlightTicket; 