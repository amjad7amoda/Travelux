const { body } = require('express-validator');
const validateMiddleware = require('../../../middlewares/validatorMiddleware');

exports.createStationValidator = [
    body('name')
        .notEmpty().withMessage('Station name is required.').bail()
        .isLength({ min: 2, max: 144 }).withMessage('Station name must be between 2 and 100 characters.')
        .trim(),
    
    body('country')
        .notEmpty().withMessage('Country is required.').bail()
        .isLength({ min: 2, max: 75 }).withMessage('Country must be between 2 and 100 characters.')
        .trim(),

    body('city')
        .notEmpty().withMessage('City is required.').bail()
        .isLength({ min: 2, max: 100 }).withMessage('City must be between 2 and 100 characters.')
        .trim(),

    body('code')
        .optional()
        .isLength({ min: 2, max: 5 }).withMessage('Code must be between 2 and 5 characters.').bail()
        .isAlphanumeric().withMessage('Code must be alphanumeric.')
        .toUpperCase()
        .trim(),

    body('location.longitude')
        .notEmpty().withMessage('Longitude is required.').bail()
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.'),

    body('location.latitude')
        .notEmpty().withMessage('Latitude is required.').bail()
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.'),

    validateMiddleware
];



exports.updateStationValidator = [
  body('name')
    .optional()
    .bail()
    .isLength({ min: 2, max: 100 }).withMessage('Station name must be between 2 and 100 characters.')
    .trim(),

  body('city')
    .optional()
    .bail()
    .isLength({ min: 2, max: 100 }).withMessage('City must be between 2 and 100 characters.')
    .trim(),

  body('country')
    .optional()
    .bail()
    .isLength({ min: 2, max: 100 }).withMessage('Country must be between 2 and 100 characters.')
    .trim(),

  body('code')
    .optional()
    .bail()
    .isLength({ min: 2, max: 5 }).withMessage('Code must be between 2 and 5 characters.')
    .isAlphanumeric().withMessage('Code must be alphanumeric.')
    .toUpperCase()
    .trim(),

  body('location.longitude')
    .optional()
    .bail()
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.'),

  body('location.latitude')
    .optional()
    .bail()
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.'),

    validateMiddleware
];