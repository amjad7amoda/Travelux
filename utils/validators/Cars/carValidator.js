const { body } = require('express-validator');
const mongoose = require('mongoose');
const CarRentalOffice = require('../../../models/Cars/carRentalOfficeModel');
const validatorMiddleware = require('../../../middlewares/validatorMiddleware');
const ApiError = require('../../apiError');

const allowedColors = [
  'white', 'black', 'gray', 'silver', 'red', 'blue', 'green', 'yellow', 'orange', 'brown', 'beige', 'gold', 'purple', 'pink', 'maroon', 'navy', 'teal', 'cyan', 'magenta', 'lime', 'olive'
];

exports.createCarValidator = [
  body('brand')
    .notEmpty().withMessage('Brand is required').bail()
    .isLength({ min: 2, max: 50 }).withMessage('Brand must be between 2 and 50 characters').bail(),
  body('model')
    .notEmpty().withMessage('Model is required').bail()
    .isLength({ min: 1, max: 50 }).withMessage('Model must be between 1 and 50 characters').bail(),
  body('year')
    .notEmpty().withMessage('Year is required').bail()
    .isInt({ min: 1950, max: new Date().getFullYear() }).withMessage(`Year must be between 1950 and ${new Date().getFullYear()}`),
  body('gearType')
    .optional().bail()
    .isIn(['manual', 'automatic']).withMessage('Gear type must be manual or automatic'),
  body('fuelType')
    .optional().bail()
    .isIn(['petrol', 'diesel', 'electric', 'hybrid']).withMessage('Fuel type must be petrol, diesel, electric, or hybrid'),
  body('seats')
    .optional().bail()
    .isInt({ min: 2, max: 10 }).withMessage('Seats must be between 2 and 10'),
  body('color')
    .notEmpty().withMessage('Color is required').bail()
    .isLength({ min: 3, max: 15 }).withMessage('Color must be between 3 and 15 characters').bail()
    .custom((value) => {
      if (!allowedColors.includes(value.toLowerCase())) {
        throw new ApiError('Color is not allowed. Allowed colors are: ' + allowedColors.join(', '), 400);
      }
      return true;
    }),
  body('pricePerDay')
    .notEmpty().withMessage('Price per day is required').bail()
    .isFloat({ min: 1 }).withMessage('Price per day must be at least 1'),
  body('images')
    .optional().isArray().withMessage('Images must be an array of strings'),
  body('images.*')
    .optional().isString().withMessage('Each image must be a string'),
  body('status')
    .optional().isIn(['available', 'booked', 'maintenance']).withMessage('Status must be available, booked, or maintenance'),
  body('booked_until')
    .optional().isISO8601().withMessage('booked_until must be a valid date')
    .custom((value) => {
      const now = new Date();
      const max = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      const date = new Date(value);
      if (date < now) {
        throw new ApiError('booked_until must be in the future', 400);
      }
      if (date > max) {
        throw new ApiError('booked_until cannot be more than one year from now', 400);
      }
      return true;
    }),
  validatorMiddleware
];

exports.updateCarValidator = [
  body('images')
    .optional().isArray().withMessage('Images must be an array of strings'),
  body('images.*')
    .optional().isString().withMessage('Each image must be a string'),
  body('status')
    .optional().isIn(['available', 'booked', 'maintenance']).withMessage('Status must be available, booked, or maintenance'),
  body('booked_until')
    .optional().isISO8601().withMessage('booked_until must be a valid date')
    .custom((value) => {
      const now = new Date();
      const max = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      const date = new Date(value);
      if (date < now) {
        throw new ApiError('booked_until must be in the future', 400);
      }
      if (date > max) {
        throw new ApiError('booked_until cannot be more than one year from now', 400);
      }
      return true;
    }),
  validatorMiddleware
]; 