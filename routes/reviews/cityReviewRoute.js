const express = require('express');
const router = express.Router();
const cityReviewService = require('../../services/reviews/cityReviewService');
const { protect, allowTo } = require('../../services/authServices');

// @route   POST /api/country-reviews
// @desc    إضافة تقييم جديد لبلد
// @access  Private (المستخدمين المسجلين)
router.post('/', protect, cityReviewService.addCityReview);

// @route   GET /api/country-reviews
// @desc    جلب تقييمات بلد معين أو جميع التقييمات
// @access  Public
router.get('/', cityReviewService.getAllCityReviews);

// @route   DELETE /api/country-reviews/:id
// @desc    حذف تقييم من قبل المستخدم أو الأدمن
// @access  Private (المستخدمين المسجلين)
router.delete('/:id', protect, cityReviewService.deleteCityReview);

module.exports = router;
