const { body , param} = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Plane = require('../../models/planeModel');
const User = require('../../models/userModel');
const ApiError = require('../apiError');
const Airline = require('../../models/airlineModel');

exports.getPlaneValidator = [
    param('id').isMongoId().withMessage('Invalid plane id'),
    validatorMiddleware
];

exports.createPlaneValidator = [
    body('model').notEmpty().withMessage('Plane model is required')
    .isLength({min:3,max:50}).withMessage('Plane model must be at least 3 characters and less than 50 characters'),
    
    body('registrationNumber').notEmpty().withMessage('Plane registration number is required')
    .isLength({min:3,max:50}).withMessage('Plane registration number must be at least 3 characters and less than 50 characters'),
    
    body('seatsEconomy').notEmpty().withMessage('Plane seats economy is required')
    .isInt({min:0}).withMessage('Plane seats economy must be at least 0')
    .isInt({max:150}).withMessage('Plane seats economy must be max 100'),

    body('seatsBusiness').notEmpty().withMessage('Plane seats business is required')
    .isInt({min:0}).withMessage('Plane seats business must be at least 0')
    .isInt({max:150}).withMessage('Plane seats business must be max 100'),
    
    body('currentLocation').notEmpty().withMessage('Plane current location is required'),
    
    body('airline').notEmpty().withMessage('Plane airline is required')
    .isMongoId().withMessage('Invalid airline id')
    .custom(async (value, { req }) => {
        const airline = await Airline.findById(value);
        if (!airline) {
            throw new Error('Airline not found');
        }
    }),
    validatorMiddleware


]
