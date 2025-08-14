const express = require('express');
const router = express.Router();
const { protect, allowTo } = require('../../services/authServices');
const CouponService = require('../../services/Payments/couponService');
const CouponValidator = require('../../utils/validators/Payments/couponValidator');
router.use(protect, allowTo('admin'));

router
    .route('/')
    .get(CouponService.getAllCoupons)
    .post(CouponValidator.createCouponValidator, CouponService.createCoupon);

router
    .route('/:id')
    .get(CouponService.getCoupon)
    .put(CouponValidator.updateCouponValidator, CouponService.updateCoupon)
    .delete(CouponService.deleteCoupon);

module.exports = router;