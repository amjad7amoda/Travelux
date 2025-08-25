const mongoose = require("mongoose");

const countryReviewSchema = new mongoose.Schema({
    // المستخدم الذي كتب التقييم
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // البلد التي تم تقييمها
    country: {
        type: String,
        required: true,
        trim: true
    },
    
    // التقييم (رقم عشري)
    rating: {
        type: Number,
        required: true,
        min: [0, 'Rating must be 0 or greater'],
        max: [5, 'Rating cannot exceed 5']
    },
    
    // عنوان التقييم
    title: {
        type: String,
        required: true,
        trim: true
    }
    
}, { 
    timestamps: true
});



const CountryReview = mongoose.model('CountryReview', countryReviewSchema);

module.exports = CountryReview;
