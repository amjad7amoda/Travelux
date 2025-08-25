const CountryReview = require('../../models/reviews/countryReviewModel');
const asyncHandler = require('../../middlewares/asyncHandler');
const europeanCountries = require('../../data/europeanCountries.json');
const ApiError = require('../../utils/apiError');
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
        return next(new ApiError('Country not found in European countries list', 400));
    }
    
    // التحقق من أن المستخدم لم يقيم نفس البلد من قبل
    const existingReview = await CountryReview.findOne({
        user: req.user.id,
        country: country
    });
    
    if (existingReview) {
        return next(new ApiError('You have already reviewed this country', 400));
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
        status: "SUCCESS",
        data: {
            countryReview: populatedReview
        }
    });
});

// @desc حذف تقييم من قبل المستخدم أو الأدمن
// @route DELETE /api/country-reviews/:id
// @access private
exports.deleteCountryReview = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // البحث عن التقييم
    const review = await CountryReview.findById(id);
    
    if (!review) {
        return next(new ApiError('Review not found', 404));
    }
    
    // إذا كان المستخدم أدمن، يمكنه حذف أي تقييم
    if (req.user.role === 'admin') {
        await CountryReview.findByIdAndDelete(id);
        return res.status(200).json({
            status: "SUCCESS",
            msg: "deleted by admin"
        });
    }
    
    // إذا كان المستخدم عادي، يجب أن يكون صاحب التقييم
    if (review.user.toString() !== req.user.id) {
        return next(new ApiError('You are not authorized to delete this review', 403));
    }
    
    // حذف التقييم
    await CountryReview.findByIdAndDelete(id);
    
    res.status(200).json({
        status: "SUCCESS",
        msg: "deleted"
    });
});

// @desc جلب تقييمات بلد معين أو جميع التقييمات
// @route GET /api/country-reviews
// @access public
exports.getAllCountryReviews = asyncHandler(async (req, res, next) => {
    const { country, sort = '-createdAt' } = req.query;
    
    // بناء query
    let query = {};
    
    // إذا تم إرسال بلد معين، أضف فلتر البلد
    if (country) {
        query.country = { $regex: country, $options: 'i' };
    }
    
    // جلب التقييمات مع معلومات المستخدمين
    const reviews = await CountryReview.find(query)
        .populate('user', 'firstName lastName email avatar')
        .sort(sort);
    


    res.status(200).json({
        status: "SUCCESS",
        data: {
            countryReviews: reviews
        }
    });
});
