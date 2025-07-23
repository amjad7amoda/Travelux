const { body } = require('express-validator');
const mongoose = require('mongoose');
const validateMiddleware = require('../../../middlewares/validatorMiddleware');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const isFutureDate = (value) => new Date(value) > new Date();

exports.createTrainTripValidator = [
  body('route')
    .bail()
    .notEmpty().withMessage('Route is required.')
    .custom(isObjectId).withMessage('Invalid route ID.'),

  body('train')
    .bail()
    .notEmpty().withMessage('Train is required.')
    .custom(isObjectId).withMessage('Invalid train ID.'),

  body('availabeSeats')
    .optional()
    .bail()
    .isInt({ min: 1 }).withMessage('Available seats must be at least 1.'),

  body('price')
    .bail()
    .notEmpty().withMessage('Price is required.')
    .isFloat({ min: 1 }).withMessage('Price must be at least 1.'),

  body('status')
    .optional()
    .isIn(['scheduled', 'delayed', 'cancelled', 'completed'])
    .withMessage('Invalid status.'),

  body('estimatedTime')
    .optional()
    .bail()
    .isInt({ min: 1 }).withMessage('Estimated time must be at least 1 minute.'),

  body('departureTime')
    .bail()
    .notEmpty().withMessage('Departure time is required.')
    .isISO8601().withMessage('Invalid departure time.')
    .custom(isFutureDate).withMessage('Departure time must be in the future.'),

  body('arrivalTime')
    .optional()
    .bail()
    .isISO8601().withMessage('Invalid arrival time.')
    .custom(isFutureDate).withMessage('Arrival time must be in the future.'),

  validateMiddleware
];



exports.updateTrainTripValidator = [
  body('route')
    .optional()
    .custom(isObjectId).withMessage('Invalid route ID.'),

  body('train')
    .optional()
    .custom(isObjectId).withMessage('Invalid train ID.'),

  body('availabeSeats')
    .optional()
    .isInt({ min: 1 }).withMessage('Available seats must be at least 1.'),

  body('price')
    .optional()
    .isFloat({ min: 1 }).withMessage('Price must be at least 1.'),

  body('status')
    .optional()
    .isIn(['scheduled', 'delayed', 'cancelled', 'completed'])
    .withMessage('Invalid status.'),

  body('estimatedTime')
    .optional()
    .isInt({ min: 1 }).withMessage('Estimated time must be at least 1 minute.'),

  body('departureTime')
    .optional()
    .isISO8601().withMessage('Invalid departure time.')
    .custom(isFutureDate).withMessage('Departure time must be in the future.'),

  body('arrivalTime')
    .optional()
    .isISO8601().withMessage('Invalid arrival time.')
    .custom(isFutureDate).withMessage('Arrival time must be in the future.'),


  validateMiddleware
];