const { body } = require('express-validator');
const validateMiddleware = require('../../../middlewares/validatorMiddleware');
const Coupon = require('../../../models/Payments/couponModel')
const ApiError = require('../../apiError');

exports.createCouponValidator = [
    body('code')
      .notEmpty().withMessage('Coupon code is required').bail()
      .isString().withMessage('Coupon code must be a string').bail()
      .custom(async (value) => {
        const coupon = await Coupon.findOne({ code: value });
        if(coupon){
          throw new ApiError(`This coupon already exists`, 400)
        }

        return true
      })
      .trim(),
  
    body('expiresAt')
      .notEmpty().withMessage('Coupon expiration date is required')
      .isISO8601().withMessage('Coupon expiration date must be a valid date')
      .custom((value) => {
        const now = new Date();
        const enteredDate = new Date(value);
        if (enteredDate <= now) {
          throw new ApiError('Coupon expiration date must be in the future', 400);
        }
        return true;
      }),    

    body('discount')
      .notEmpty().withMessage('Coupon discount is required').bail()
      .isNumeric().withMessage('Coupon discount must be a number').bail()
      .isFloat({ min: 1 }).withMessage('Coupon discount must be at least 1').bail(),

      validateMiddleware
  ];



  exports.updateCouponValidator = [
    body('code')
      .optional()
      .isString().withMessage('Coupon code must be a string')
      .trim(),
  
    body('expiresAt')
      .optional()
      .isISO8601().withMessage('Coupon expiration date must be a valid date')
      .custom((value) => {
        const now = new Date();
        const enteredDate = new Date(value);
        if (enteredDate <= now) {
          throw new Error('Coupon expiration date must be in the future');
        }
        return true;
      }),
  
    body('discount')
      .optional()
      .isNumeric().withMessage('Coupon discount must be a number')
      .isFloat({ min: 1 }).withMessage('Coupon discount must be at least 1'),

      validateMiddleware
  ];