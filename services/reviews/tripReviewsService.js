const TripReview = require('../../models/reviews/tripReviewsModel');
const Factory = require('../handlersFactory');
const asyncHandler = require('../../middlewares/asyncHandler');
const TripTicket = require('../../models/trips/tripTicketModel');
const GlobalErrorHandler = require('../../utils/apiError');

// @desc middleware for nested route to get reviews for trip '/:tripId/tripReviews'
// @route get /api/trips/:tripId/tripReviews
// @access public
exports.createFilterObj=(req,res,next)=>{
    let filterObj = {};
    if(req.params.tripId)
            filterObj = {trip:req.params.tripId};
    req.filteration = filterObj;
    next();
};

// @desc middleware for nested route to create review from trip '/:tripId/tripReviews'
// @route post /api/trips/:tripId/tripReviews
// @access private
exports.setTripIdToBody=(req,res,next)=>{
    //nested route

    
    if(!req.body.trip) req.body.trip = req.params.tripId;
    next();
}



// @desc get list of reviews
// @route get /api/tripReviews/
// @access public
exports.getAllTripReviews=Factory.GetAll(TripReview,"TripReview");


// @desc get specific review
// @route get /api/tripReviews/:id
// @access public
exports.getTripReview=Factory.GetOne(TripReview);

// @desc creat new trip review
// @route post /api/tripReviews
// @access private/protect/user
exports.createTripReview = asyncHandler(async(req, res, next) => {
    // Check if user has an expired trip ticket for this trip

    const hasExpiredTicket = await TripTicket.findOne({
        user: req.user._id,
        trip: req.body.trip,
        status: 'expired'
    });

    if (!hasExpiredTicket) {
        return next(new GlobalErrorHandler('You can only review trips that you have completed', 403));
    }
    // validate if user has already reviewed this trip
    const alreadyReviewed = await TripReview.findOne({
        trip: req.body.trip,
        user: req.user._id
    });
    if (alreadyReviewed) {
        return next(new GlobalErrorHandler('You have already reviewed this trip', 403));
    }

    const review = await TripReview.create({
        title: req.body.title,
        rating: req.body.rating,
        trip: req.body.trip,
        user: req.user._id
    });
    res.status(201).json({status: "SUCCESS", data: review});
});

// @desc delete trip review by id
// @route delete /api/tripReviews/:id
// @access private/protect/admin
exports.deleteTripReview=Factory.DeleteOne(TripReview);