const mongoose = require('mongoose');

const trainTripSchema = mongoose.Schema({
    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    train: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Train',
        required: true
    },
    availableSeats: {
        type: Number,
        required: true,
        min: 0
    },
    price: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['preparing', 'prepared', 'delayed', 'cancelled', 'completed'],
        default: 'preparing'
    },
    estimatedTime: {
        type: Number,
        required: true,
        min: 1
    },
    estimatedTimeStr: String,
    departureTime: {
        type: Date,
        required: true,
    },
    arrivalTime: {
        type: Date,
        required: true,
    },
    stopDuration: {
        type: Number,
        default: 5
    },
    stations: [{
        station: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Station'
        },
        order: {
            type: Number,
            min: 1
        },
        distanceFromPrevKm: {
            type: Number,
        },
        arrivalOffset: {
            type: Number,
        },
        departureOffset: {
            type: Number,
        },
        arrivalTimeStr: String,
        departureTimeStr: String
    }]
});

module.exports = mongoose.model('TrainTrip', trainTripSchema);