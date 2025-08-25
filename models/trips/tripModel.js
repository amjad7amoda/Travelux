const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config();

const tripSchema = new mongoose.Schema({
    // in body
    title: {
        type: String,
        required: true,
        minlength: [3, 'Trip title must be at least 3 characters'],
        maxlength: [50, 'Trip title must be less than 50 characters'],
    },
    // in body
    description: {
        type: String,
        required: true,
    },
    // in body
    price: {
        type: Number,
        required: true,
        min: [0, 'Trip price must be greater than 0'],
    },
    // auto calculate from events start and end time [days]
    duration: {
        type: Number,
        min: [0, 'Trip duration must be at least 0 day'],
        max: [30, 'Trip duration must be less than 30 days'],
        default: 0,
    },
    // in body
    country: {
        type: String,
        required: true,
    },
    // in body
    city: {
        type: String,
        required: true,
    },
    // in body
    maxGroupSize: {
        type: Number,
        required: true,
        min: [1, 'Trip max group size must be at least 1'],
        max: [100, 'Trip max group size must be less than 100'],
    },
    //default
    language: {
        type: String,
        required: true,
        default: 'english',
    },
    // in body , just one category
    category: {
        type: String,
        required: true,
        enum: ['adventure',
             'cultural',
                'nature',
               'family',
                'romantic',
                'hiking',
                'beach',
                'skiing',
                'camping',
                'fishing',
                'sightseeing',
                'food',
                'music',
                'art',
                'history',
                'sports',
                 'other'],
    },
    //default
    requirements: {
        type: [String],
        default: ['valid passport', 'comfortable walking shoes']
    },
    //default
    registeredUsers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        tripTicketId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TripTicket',
            required: true
        },
        numberOfPassengers: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    // in body
    guider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guider',
        required: true
    },
    //default
    status: {
        type: String,
        enum: ['pending','cancelled','completed','onTheWay','archived'],
            default: 'pending',
    },
    //in body   
    events: {
        type: [{
            eventId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Event',
                required: true
            },
            order: {
                type: Number,
                required: true,
                min: 1
            },
            //hours
            duration: {
                type: Number,
                required: true,
                min: 0.5,
                max: 24
            },
            startTime: {
                type: Date,
                required: true
            },
            endTime: {
                type: Date,
                required: true
            }
        }],
        default: []
    },
    //in body
    tripCover: {
        type: String,
        required: true,
    },

    ratingsAverage:{
        type:Number,
        min:[1,'rating average must be 1 or greater '],
        max:[5,'max rating is 5']
    },
    ratingsQuantity:{
        type:Number,
        default:0
    },
}, {timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }});

// get one && get all && update
// تم إزالة middleware post('init') - سيتم معالجة tripCover في الخدمات

tripSchema.virtual('reviews',{
    ref:"TripReview",
    foreignField:"trip",
    localField:"_id"
});

const Trip = mongoose.model('Trip', tripSchema);
module.exports = Trip;
