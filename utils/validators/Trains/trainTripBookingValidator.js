const { body } = require('express-validator');
const validateMiddleware = require('../../../middlewares/validatorMiddleware');

exports.createTrainTripBookingValidator = [
    body('trainTrip')
      .notEmpty().withMessage('Train trip ID is required')
      .isMongoId().withMessage('Invalid trip ID'),

    body('numOfSeats')
        .notEmpty().withMessage('Choose number of seats.')
        .isInt({ min: 1 }).withMessage('Invalid number of seats.'),

    body('startCity')
        .bail()
        .notEmpty().withMessage('You should specify the start station'),
        
    body('endCity')
        .bail()
        .notEmpty().withMessage('You should specify the end station'),
      validateMiddleware
];

exports.updateTrainTripBookingValidator = [
    body('status')
    .optional()
    .isIn(['cancelled']).withMessage('Invalid status value'),

    body('addSeats')
    .optional()
    .bail()
    .isInt({ min: 1 }).withMessage('addSeats must be an integer greater than 0'),

    body('removeSeats')
    .optional()
    .bail()
    .isInt({ min: 1 }).withMessage('removeSeats must be an integer greater than 0'),

    validateMiddleware
]