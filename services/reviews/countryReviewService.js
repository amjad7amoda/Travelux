const CountryReview = require('../../models/reviews/countryReviewModel');
const asyncHandler = require('../../middlewares/asyncHandler');
const europeanCountries = require('../../data/europeanCountries.json');

// @desc إضافة تقييم جديد لبلد
// @route POST /api/country-reviews
// @access private
exports.addCountryReview = asyncHandler(async (req, res, next) => {
    const { country, rating, title } = req.body;
    
    // التحقق من أن البلد موجودة في قائمة البلدان الأوروبية
    const countryExists = europeanCountries.countries.find(
        c => c.name.toLowerCase() === country.toLowerCase()
    );
    
    if (!countryExists) {
        return res.status(400).json({
            success: false,
            message: 'Country not found in European countries list'
        });
    }
    
    // التحقق من أن المستخدم لم يقيم نفس البلد من قبل
    const existingReview = await CountryReview.findOne({
        user: req.user.id,
        country: country
    });
    
    if (existingReview) {
        return res.status(400).json({
            success: false,
            message: 'You have already reviewed this country'
        });
    }
    
    // إنشاء التقييم الجديد
    const newReview = await CountryReview.create({
        user: req.user.id,
        country,
        rating,
        title
    });
    
    // جلب التقييم مع معلومات المستخدم
    const populatedReview = await CountryReview.findById(newReview._id)
        .populate('user', 'name email avatar');
    
    res.status(201).json({
        success: true,
        data: populatedReview
    });
});

// @desc حذف تقييم من قبل المستخدم
// @route DELETE /api/country-reviews/:id
// @access private
exports.deleteCountryReview = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // البحث عن التقييم
    const review = await CountryReview.findById(id);
    
    if (!review) {
        return res.status(404).json({
            success: false,
            message: 'Review not found'
        });
    }
    
    // التحقق من أن المستخدم هو من كتب التقييم
    if (review.user.toString() !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: 'You are not authorized to delete this review'
        });
    }
    
    // حذف التقييم
    await CountryReview.findByIdAndDelete(id);
    
    res.status(200).json({
        success: true,
        message: 'Review deleted successfully'
    });
});

// @desc جلب كل التقييمات
// @route GET /api/country-reviews
// @access public
exports.getAllCountryReviews = asyncHandler(async (req, res, next) => {
    const { country, rating, sort = '-createdAt' } = req.query;
    
    // بناء query
    let query = {};
    
    // فلترة حسب البلد
    if (country) {
        query.country = { $regex: country, $options: 'i' };
    }
    
    // فلترة حسب التقييم
    if (rating) {
        query.rating = { $gte: parseFloat(rating) };
    }
    
    // جلب التقييمات مع معلومات المستخدمين
    const reviews = await CountryReview.find(query)
        .populate('user', 'name email avatar')
        .sort(sort);
    
    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews
    });
});
