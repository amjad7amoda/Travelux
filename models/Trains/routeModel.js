const mongoose = require('mongoose');

const routeSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    routeManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isInternational: {
        type: Boolean,
        default: false
    },
    stations: [{
        station: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station',
        required: true
        }
    }]
}, {timestamps: true})

module.exports = mongoose.model('Route', routeSchema);