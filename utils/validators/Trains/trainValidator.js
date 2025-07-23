const { body } = require('express-validator');
const validateMiddleware = require('../../../middlewares/validatorMiddleware');

exports.createTrainValidator = [
  body('name')
    .notEmpty().withMessage('Train name is required').bail()
    .isString().withMessage('Train name must be a string').bail()
    .isLength({ min: 2, max: 100 }).withMessage('Train name must be between 2 and 100 characters')
    .trim(),

  body('speed')
    .notEmpty().withMessage('Train speed is required').bail()
    .isFloat({ min: 50 }).withMessage('Speed must be a positive number'),

  body('numberOfSeats')
    .notEmpty().withMessage('Number of seats is required').bail()
    .isInt({ min: 1 }).withMessage('Number of seats must be an integer of at least 1'),

  body('status')
    .optional()
    .isIn(['booked', 'maintenance', 'out_of_service', 'available']).withMessage('Invalid train status'),

  body('booked_until')
    .optional()
    .isISO8601().withMessage('booked_until must be a valid ISO date').bail()
    .custom((value, { req }) => {
      if (req.body.status === 'booked' && new Date(value) <= new Date()) {
        throw new Error('booked_until must be a future date when status is "booked"');
      }
      return true;
    }),

    validateMiddleware
];


exports.updateTrainValidator = [
  body('name')
    .optional().bail()
    .isString().withMessage('Train name must be a string').bail()
    .isLength({ min: 2, max: 100 }).withMessage('Train name must be between 2 and 100 characters')
    .trim(),

  body('speed')
    .optional().bail()
    .isFloat({ min: 0 }).withMessage('Speed must be a positive number'),

  body('numberOfSeats')
    .optional().bail()
    .isInt({ min: 1 }).withMessage('Number of seats must be an integer of at least 1'),

  body('status')
    .optional().bail()
    .isIn(['booked', 'maintenance', 'out_of_service', 'available']).withMessage('Invalid train status'),

  body('booked_until')
    .optional().bail()
    .isISO8601().withMessage('booked_until must be a valid ISO date').bail()
    .custom((value, { req }) => {
      if (req.body.status === 'booked' && new Date(value) <= new Date()) {
        throw new Error('booked_until must be a future date when status is "booked"');
      }
      return true;
    }),

  validateMiddleware
];