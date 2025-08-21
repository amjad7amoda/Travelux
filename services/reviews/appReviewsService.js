const AppReview = require('../../models/reviews/appReviewsModel');
const Factory = require('../handlersFactory');
const asyncHandler = require('../../middlewares/asyncHandler');

// @desc get all app reviews with user details
// @route get /api/appReviews/
// @access public
exports.getAllAppReviews = asyncHandler(async (req, res, next) => {
    const reviews = await AppReview.find()
        .populate({
            path: 'user',
            select: 'name'
        })
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: "SUCCESS",
        results: reviews.length,
        data: reviews
    });
});

// @desc get specific app review
// @route get /api/appReviews/:id
// @access public
exports.getAppReview = Factory.GetOne(AppReview);

// @desc create new app review
// @route post /api/appReviews
// @access private/protect/user
exports.createAppReview = asyncHandler(async (req, res, next) => {
    // Check if user has already reviewed the app
    const alreadyReviewed = await AppReview.findOne({
        user: req.user._id
    });

    if (alreadyReviewed) {
        return next(new GlobalErrorHandler('You have already reviewed the app', 403));
    }

    // Check if user has at least one completed bill
    const Bill = require('../../models/Payments/billModel');
    const hasCompletedBill = await Bill.findOne({
        user: req.user._id,
        status: 'completed'
    });

    if (!hasCompletedBill) {
        return next(new GlobalErrorHandler('You must have at least one completed transaction to review the app', 403));
    }

    const review = await AppReview.create({
        title: req.body.title,
        usabilityRating: req.body.usabilityRating,
        servicesRating: req.body.servicesRating,
        reliabilityRating: req.body.reliabilityRating,
        performanceRating: req.body.performanceRating,
        user: req.user._id
    });

    // Populate user details
    await review.populate({
        path: 'user',
        select: 'name'
    });

    res.status(201).json({
        status: "SUCCESS",
        data: review
    });
});

// @desc delete app review by id
// @route delete /api/appReviews/:id
// @access private/protect/admin
exports.deleteAppReview = Factory.DeleteOne(AppReview);
