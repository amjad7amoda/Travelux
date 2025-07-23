const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config();

const planeSchema = new mongoose.Schema({
    // sended by airline owner
    model: {
        type: String,
        required: [true, 'Plane model is required'],
        minlength: [3, 'Plane model must be at least 3 characters'],
        maxlength: [50, 'Plane model must be less than 50 characters'],
    },
    // sended by airline owner
    registrationNumber: {
        type: String,
        required: [true, 'Plane registration number is required'],
        minlength: [3, 'Plane registration number must be at least 3 characters'],
        maxlength: [50, 'Plane registration number must be less than 50 characters'],
    },
    // auto filled from airline of the airline owner
    airline: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Airline",
        required: [true, 'Plane airline is required'],
    },
    // sended by airline owner
    seatsEconomy: {
        type: Number,
        required: [true, 'Plane seats economy is required'],
        min: [0, 'Plane seats economy must be at least 0'],
        max: [150, 'Plane seats economy must be max 150'],
    },
    // sended by airline owner
    seatsBusiness: {
        type: Number,
        required: [true, 'Plane seats business is required'],
        min: [0, 'Plane seats business must be at least 0'],
        max: [150, 'Plane seats business must be max 150'],
    },
    // auto filled from default value
    status: {
        type: String,
        enum: ['availableToFlight', 'maintenance', 'inFlight'],
        default: 'availableToFlight',
    },
    currentLocation: {
        type: String,
        required: [true, 'Plane current location is required'],
    },

}, { timestamps: true });


const Plane = mongoose.model("Plane", planeSchema);

module.exports = Plane;
