const { body , param} = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Airline = require('../../models/airlineModel');
const User = require('../../models/userModel');
const ApiError = require('../apiError');

exports.getAirlineValidator = [
    param('id').isMongoId().withMessage('Invalid airline id'),
    validatorMiddleware
];


exports.createAirlineValidator = [
    body('name').notEmpty().withMessage('Airline name is required')
    .isLength({min:3,max:100}).withMessage('Airline name must be at least 3 characters and less than 100 characters'),
    body('description').notEmpty().withMessage('Airline description is required')
    .isLength({min:10,max:100}).withMessage('description must be at least 10 characters and less than 100 characters'),
    body('country').notEmpty().withMessage('Airline country is required'),
    body('logo').optional(),
    body('owner')
        .isMongoId().withMessage('Invalid owner id')
        .custom(async (value, { req }) => {
            // Check if user exists
            const user = await User.findById(value);
            if (!user) {
                throw new Error('Owner does not exist');
            }

            // Check if user already owns an airline
            const existingAirline = await Airline.findOne({ owner: value });
            if (existingAirline) {
                throw new Error('User already owns an airline');
            }

            return true;
        }),
    validatorMiddleware
];

exports.updateAirlineValidator = [
    param('id').isMongoId().withMessage('Invalid airline id'),
    body('name').optional(),
    body('description').optional(),
    body('country').optional(),
    body('logo').optional(),
    body('owner').optional(),
    validatorMiddleware
];

exports.updateOwnerAirlineValidator = [
    body('name').optional(),
    body('description').optional(),
    body('country').optional(),
    body('logo').optional(),
    body('owner').custom(async (value, { req }) => {
        if (value) {
            throw new Error('you can not change the owner of the airline');
        }
        return true;
    }),
    validatorMiddleware
];















