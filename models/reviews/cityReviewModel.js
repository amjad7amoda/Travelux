const mongoose = require("mongoose");

const cityReviewSchema = new mongoose.Schema({
    // المستخدم الذي كتب التقييم
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // المدينة التي تم تقييمها
    city: {
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



const CityReview = mongoose.model('CityReview', cityReviewSchema);

module.exports = CityReview;
