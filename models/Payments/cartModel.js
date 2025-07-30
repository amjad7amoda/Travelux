const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    items: [{
        bookingType: {
            type: String,
            enum: ['flight', 'car', 'hotel', 'trainTrip'],
            required: [true, 'Booking type is required']
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FlightTicket' | 'CarBooking' | 'Booking' | 'TrainTripBooking',
            required: [true, 'Booking ID is required']
        },
        price: Number,
        quantity: Number
    }],
    totalCartPrice: Number,
    totalPriceAfterDiscount: Number,
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    }
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);