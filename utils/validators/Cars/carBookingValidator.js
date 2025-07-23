const { body } = require('express-validator');
const mongoose = require('mongoose');
const validatorMiddleware = require('../../../middlewares/validatorMiddleware');
const ApiError = require('../../apiError');

exports.createCarBookingValidator = [
  body('car')
    .notEmpty().withMessage('Car is required').bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid car ID'),
  body('startDate')
    .notEmpty().withMessage('Start date is required').bail()
    .isISO8601().withMessage('Start date must be a valid date')
    .custom((value) => {
      const now = new Date();
      now.setHours(0,0,0,0);
      const start = new Date(value);
      if (start < now) {
        throw new ApiError('Start date must be today or in the future', 400);
      }
      return true;
    }),
  body('endDate')
    .notEmpty().withMessage('End date is required').bail()
    .isISO8601().withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      const start = new Date(req.body.startDate);
      const end = new Date(value);
      if (end <= start) {
        throw new ApiError('End date must be after start date', 400);
      }
      //Check if booking duration is less than one month
      const oneMonthLater = new Date(start);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      if (end > oneMonthLater) {
        throw new ApiError('Maximum booking duration is one month. Please renew the contract monthly.', 400);
      }
      return true;
    }),
    
  validatorMiddleware
]; 

exports.updateCarBookingValidator = [
  body('car').not().exists().withMessage('Cannot change the booked car'),
  body('user').not().exists().withMessage('Cannot change the booking user'),
  body('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid date')
    .custom((value) => {
      const now = new Date();
      now.setHours(0,0,0,0);
      const start = new Date(value);
      if (start < now) {
        throw new ApiError('Start date must be today or in the future', 400);
      }
      return true;
    }),
  body('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      const start = req.body.startDate ? new Date(req.body.startDate) : undefined;
      const booking = req.booking; // to be set in controller if needed
      let effectiveStart = start;
      if (!effectiveStart && booking) effectiveStart = booking.startDate;
      if (!effectiveStart) return true; // can't validate without start
      const end = new Date(value);
      if (end <= effectiveStart) {
        throw new ApiError('End date must be after start date', 400);
      }
      const oneMonthLater = new Date(effectiveStart);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      if (end > oneMonthLater) {
        throw new ApiError('Maximum booking duration is one month. Please renew the contract monthly.', 400);
      }
      return true;
    }),
  body('status')
    .optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid status'),
  body('paymentStatus')
    .optional().isIn(['pending_payment', 'paid', 'failed']).withMessage('Invalid payment status'),
  validatorMiddleware
]; 