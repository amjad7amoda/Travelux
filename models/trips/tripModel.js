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
        required: true,
        min: [1, 'Trip duration must be at least 1 day'],
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
        enum: ['pending','cancelled','completed','full','onTheWay'],
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
        required: true,
    },
    //in body
    tripCover: {
        type: String,
        required: true,
    },
}, {timestamps: true,});

// get one && get all && update
tripSchema.post('init',async(doc)=>{
    if(doc.tripCover){
        // إذا كان يحتوي على رابط كامل، استخراج اسم الملف فقط
        if(doc.tripCover.startsWith('http')){
            // استخراج اسم الملف من الرابط
            const fileName = doc.tripCover.split('/').pop();
            doc.tripCover = `${process.env.BASE_URL}/trips/${fileName}`;
        } else {
            // إذا كان اسم ملف فقط، إضافة الرابط الكامل
            const tripCoverUrl = `${process.env.BASE_URL}/trips/${doc.tripCover}`;
            doc.tripCover = tripCoverUrl;
        }
    }
})

const Trip = mongoose.model('Trip', tripSchema);
module.exports = Trip;
