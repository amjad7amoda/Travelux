const { body } = require('express-validator')
const mongoose = require('mongoose'); 
const validateMiddleware = require('../../../middlewares/validatorMiddleware')

const validObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

exports.createRouteValidator = [
    body('name')
    .bail()
    .notEmpty().withMessage('You should specify route name')
    .isLength({ max: 100 }).withMessage('Route name must not exceed 100 characters.'),

    body('isInternational')
    .optional()
    .isBoolean().withMessage('isInternational must be a boolean.'),

    body('stations')
    .bail()
    .isArray({ min: 2 }).withMessage('Stations must be 2 at least'),

    validateMiddleware
];



exports.updateRouteValidator = [
  body('name')
    .optional()
    .bail()
    .isLength({ max: 100 }).withMessage('Route name must not exceed 100 characters.'),

  body('routeManager')
    .optional()
    .bail()
    .custom((value) => validObjectId(value)).withMessage('Invalid route manager ID.'),

  body('isInternational')
    .optional()
    .isBoolean().withMessage('isInternational must be a boolean.'),

  body('stations')
    .optional()
    .bail()
    .isArray({ min: 2 }).withMessage('Stations must be an array with at least 2 items.'),

  body('stations.*.station')
    .optional()
    .bail()
    .notEmpty().withMessage('Station ID is required.')
    .custom(value => validObjectId(value)).withMessage('Invalid station ID.'),

  validateMiddleware
];