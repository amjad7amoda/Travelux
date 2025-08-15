const { body , param} = require("express-validator");
const validatorMiddleware = require("../../../middlewares/validatorMiddleware");
const Event = require('../../../models/trips/eventModel');

exports.getEventValidator = [
    param('id').isMongoId().withMessage('Invalid event id'),
    validatorMiddleware
];


exports.createEventValidator = [
    body('title').notEmpty().withMessage('Event title is required')
    .isLength({min:3,max:100}).withMessage('Event title must be at least 3 characters and less than 100 characters'),
    body('description').notEmpty().withMessage('Event description is required')
    .isLength({min:10,max:200}).withMessage('description must be at least 10 characters and less than 100 characters'),
    body('cover').optional(),
    body('location').notEmpty().withMessage('Event location is required')
    .isLength({min:3,max:100}).withMessage('Event location must be at least 3 characters and less than 100 characters'),
    validatorMiddleware
];

exports.updateEventValidator = [
    param('id').isMongoId().withMessage('Invalid event id'),
    body('name').optional(),
    body('description').optional(),
    body('location').optional(),
    body('cover').optional(),
    validatorMiddleware
];
















