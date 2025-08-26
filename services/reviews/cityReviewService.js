const CityReview = require('../../models/reviews/cityReviewModel');
const asyncHandler = require('../../middlewares/asyncHandler');
const europeanCountries = require('../../data/europeanCountries.json');
const ApiError = require('../../utils/apiError');
// @desc إضافة تقييم جديد لبلد
// @route POST /api/cityReviews
// @access private
exports.addCityReview = asyncHandler(async (req, res, next) => {
    const { city, rating, title } = req.body;
    
    // check if the city exists and belongs to a european country
    const cityExists = europeanCountries.countries.find(
        c => c.cities.find(city => city.toLowerCase() === city.toLowerCase())
    );
    
    if (!cityExists) {
        return next(new ApiError('City not found in European cities list', 400));
    }
    
    // التحقق من أن المستخدم لم يقيم نفس البلد من قبل
    const existingReview = await CityReview.findOne({
        user: req.user.id,
        city: city
    });
    
    if (existingReview) {
        return next(new ApiError('You have already reviewed this city', 400));
    }
    
    // إنشاء التقييم الجديد
    const newReview = await CityReview.create({
        user: req.user.id,
        city,
        rating,
        title
    });
    
    // جلب التقييم مع معلومات المستخدم
    const populatedReview = await CityReview.findById(newReview._id)
        .populate('user', 'name email avatar');
    
    res.status(201).json({
        status: "SUCCESS",
        data: {
            countryReview: populatedReview
        }
    });
});

// @desc حذف تقييم من قبل المستخدم أو الأدمن
// @route DELETE /api/cityReviews/:id
// @access private
exports.deleteCityReview = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // البحث عن التقييم
    const review = await CityReview.findById(id);
    
    if (!review) {
        return next(new ApiError('Review not found', 404));
    }
    
    // إذا كان المستخدم أدمن، يمكنه حذف أي تقييم
    if (req.user.role === 'admin') {
        await CityReview.findByIdAndDelete(id);
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
    await CityReview.findByIdAndDelete(id);
    
    res.status(200).json({
        status: "SUCCESS",
        msg: "deleted"
    });
});

// @desc جلب تقييمات بلد معين أو جميع التقييمات
// @route GET /api/cityReviews
// @access public
exports.getAllCityReviews = asyncHandler(async (req, res, next) => {
    const { city, sort = '-createdAt' } = req.query;
    
    // بناء query
    let query = {};
    
    // إذا تم إرسال بلد معين، أضف فلتر البلد
    if (city) {
        query.city = { $regex: city, $options: 'i' };
    }
    
    // جلب التقييمات مع معلومات المستخدمين
    const reviews = await CityReview.find(query)
        .populate('user', 'firstName lastName email avatar')
        .sort(sort);
    


    res.status(200).json({
        status: "SUCCESS",
        data: {
            cityReviews: reviews
        }
    });
});
