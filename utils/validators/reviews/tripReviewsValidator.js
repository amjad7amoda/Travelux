const { body , param} = require("express-validator");
const validatorMiddleware = require("../../../middlewares/validatorMiddleware");
const Trip = require("../../../models/trips/tripModel");

// get trip reviews validator
exports.getTripReviewValidator = [
    param('tripId').isMongoId().withMessage('Invalid trip id'),
    validatorMiddleware
];

//create trip review validator
exports.createTripReviewValidator = [
    body('trip').isMongoId().withMessage('Invalid trip id').custom(async(value, {req}) => {
        
        const trip = await Trip.findById(value);
        if(!trip) {
            throw new Error('Trip not found');
        }
        return true;
    }),
    body('rating').isFloat({min:1,max:5}).withMessage('Rating must be between 1 and 5'),
    body('title').optional().isString().withMessage('Title must be a string'),
    validatorMiddleware
];

// delete trip review validator by admin
exports.deleteTripReviewValidator = [
    param('id').isMongoId().withMessage('Invalid review id'),
    validatorMiddleware
];