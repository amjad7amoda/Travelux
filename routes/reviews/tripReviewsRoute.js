const express = require('express');

const {
    createFilterObj,
    setTripIdToBody,
    getAllTripReviews,
    getTripReview,
    createTripReview,
    deleteTripReview
} = require('../../services/reviews/tripReviewsService');

const {
    createTripReviewValidator,
    getTripReviewValidator,
    deleteTripReviewValidator
} = require('../../utils/validators/reviews/tripReviewsValidator');

const { protect, allowTo } = require('../../services/authServices');

const router = express.Router({ mergeParams: true });

router.route("/")
    .post(protect, allowTo("user"),
        setTripIdToBody,
        createTripReviewValidator,
        createTripReview)
    .get(createFilterObj, getAllTripReviews);

router.route("/:id")
    .get(getTripReviewValidator, getTripReview)
    .delete(protect, allowTo("admin"),
        deleteTripReviewValidator,
        deleteTripReview);

module.exports = router;
