const express = require('express');
const router = express.Router();
const countryReviewService = require('../../services/reviews/countryReviewService');
const { protect, allowTo } = require('../../services/authServices');

// @route   POST /api/country-reviews
// @desc    إضافة تقييم جديد لبلد
// @access  Private (المستخدمين المسجلين)
router.post('/', protect, countryReviewService.addCountryReview);

// @route   GET /api/country-reviews
// @desc    جلب تقييمات بلد معين أو جميع التقييمات
// @access  Public
router.get('/', countryReviewService.getAllCountryReviews);

// @route   DELETE /api/country-reviews/:id
// @desc    حذف تقييم من قبل المستخدم أو الأدمن
// @access  Private (المستخدمين المسجلين)
router.delete('/:id', protect, countryReviewService.deleteCountryReview);

module.exports = router;
