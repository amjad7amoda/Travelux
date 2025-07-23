const mongoose = require('mongoose');

const carRentalOfficeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        unique: true,
        minlength: [3, 'Office name must be at least 3 characters long'],
        maxlength: [50, 'Office name must be less than 50 characters'],
        required: true
    },
    officeManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    country: {
        type: String,
        trim: true,
        minlength: [3, 'Country name must be at least 3 characters long'],
        maxlength: [50, 'Country name must be less than 50 characters'],
        required: true
    },
    city: {
        type: String,
        trim: true,
        minlength: [3, 'City name must be at least 3 characters long'],
        maxlength: [50, 'City name must be less than 50 characters'],
        required: true
    },
    address: {
        type: String,
        trim: true,
        minlength: [3, 'Address must be at least 3 characters long'],
        maxlength: [100, 'Address must be less than 100 characters'],
        required: true
    },
    phone: {
        type: String,
        trim: true,
        minlength: [7, 'Phone number must be at least 10 characters long'],
        maxlength: [15, 'Phone number must be less than 15 characters'],
        required: true
    },
    coverImage: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('CarRentalOffice', carRentalOfficeSchema); 