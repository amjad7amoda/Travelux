const mongoose = require('mongoose');

const stationSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'The station name is required.'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters.']
    },
    city: {
        type: String,
        required: [true, 'The station city is required.'],
        trim: true,
        minlength: [2, 'City must be at least 2 characters.']
    },
    country: {
        type: String,
        required: [true, 'The station country is required.'],
        trim: true,
        minlength: [2, 'Country must be at least 2 characters.']
    },
    code: {
        type: String,
        uppercase: true,
        trim: true,
        minlength: [2, 'Code must be at least 2 characters.'],
        maxlength: [5, 'Code must be at most 5 characters.']
    },
    location: {
        longitude: {
            type: Number,
            required: [true, 'The location longitude is required.'],
            min: [-180, 'Longitude must be between -180 and 180.'],
            max: [180, 'Longitude must be between -180 and 180.']
        },
        latitude: {
            type: Number,
            required: [true, 'The location latitude is required.'],
            min: [-90, 'Latitude must be between -90 and 90.'],
            max: [90, 'Latitude must be between -90 and 90.']
        }
    }
}, {timestamps: true});

const StationModel = mongoose.model('Station', stationSchema);

module.exports = StationModel;