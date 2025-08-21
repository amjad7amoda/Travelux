const mongoose = require('mongoose');

const guiderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    yearsOfExperience: {
        type: Number,
        required: true,
        min: 1,
        max: 20,
        default: 1
    },
    languages: {
        type: [String],
        required: true,
        default: ['english', 'deutsch']
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 4
    },
    available: {
        type: Boolean,
        default: true,
        required: true
    },
});

module.exports = mongoose.model('Guider', guiderSchema);