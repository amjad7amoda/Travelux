const express = require('express');
const router = express.Router();
const { protect, allowTo } = require('../../services/authServices');
const CouponService = require('../../services/Payments/couponService');

router.use(protect, allowTo('admin'));

router.route('/').get(CouponService.getAllCoupons).post(CouponService.createCoupon);
router.route('/:id').get(CouponService.getCoupon).put(CouponService.updateCoupon).delete(CouponService.deleteCoupon);

module.exports = router;