const factory = require('../handlersFactory');
const Coupon = require('../../models/Payments/couponModel');


//@desc Create a new coupon
//@route POST /api/v1/coupons
//@access Private (Admin)
exports.createCoupon = factory.CreateOne(Coupon);

//@desc Get a coupon
//@route GET /api/v1/coupons/:id
//@access Private (Admin)
exports.getCoupon = factory.GetOne(Coupon);

//@desc Get all coupons
//@route GET /api/v1/coupons
//@access Private (Admin)
exports.getAllCoupons = factory.GetAll(Coupon);

//@desc Update a coupon
//@route PUT /api/v1/coupons/:id
//@access Private (Admin)
exports.updateCoupon = factory.UpdateOne(Coupon);

//@desc Delete a coupon
//@route DELETE /api/v1/coupons/:id
//@access Private (Admin)
exports.deleteCoupon = factory.DeleteOne(Coupon);
