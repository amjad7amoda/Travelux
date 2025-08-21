const mongoose = require("mongoose");

const appReviewSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    usabilityRating: {
        type: Number,
        min: [1, 'Minimum rating is 1'],
        max: [5, 'Maximum rating is 5'],
        required: [true, 'Usability rating is required']
    },
    servicesRating: {
        type: Number,
        min: [1, 'Minimum rating is 1'],
        max: [5, 'Maximum rating is 5'],
        required: [true, 'Services rating is required']
    },
    reliabilityRating: {
        type: Number,
        min: [1, 'Minimum rating is 1'],
        max: [5, 'Maximum rating is 5'],
        required: [true, 'Reliability rating is required']
    },
    performanceRating: {
        type: Number,
        min: [1, 'Minimum rating is 1'],
        max: [5, 'Maximum rating is 5'],
        required: [true, 'Performance rating is required']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    }
}, { timestamps: true });



module.exports = mongoose.model('AppReview', appReviewSchema);
