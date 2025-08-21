const express = require('express');

const {
    getAllAppReviews,
    getAppReview,
    createAppReview,
    deleteAppReview
} = require('../../services/reviews/appReviewsService');

const {
    createAppReviewValidator,
    getAppReviewValidator,
    deleteAppReviewValidator
} = require('../../utils/validators/reviews/appReviewsValidator');

const { protect, allowTo } = require('../../services/authServices');

const router = express.Router();

router.route("/")
    .post(protect, allowTo("user"), createAppReviewValidator, createAppReview)
    .get(getAllAppReviews);

router.route("/:id")
    .get(getAppReviewValidator, getAppReview)
    .delete(protect, allowTo("admin"), deleteAppReviewValidator, deleteAppReview);

module.exports = router;
