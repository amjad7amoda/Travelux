const { body, param } = require("express-validator");
const validatorMiddleware = require("../../../middlewares/validatorMiddleware");

// Get app review validator
exports.getAppReviewValidator = [
    param('id').isMongoId().withMessage('Invalid review id'),
    validatorMiddleware
];

// Create app review validator
exports.createAppReviewValidator = [
    body('title')
        .notEmpty()
        .withMessage('Title is required')
        .isString()
        .withMessage('Title must be a string')
        .isLength({ max: 500 })
        .withMessage('Title cannot be more than 500 characters'),
    
    body('usabilityRating')
        .notEmpty()
        .withMessage('Usability rating is required')
        .isFloat({ min: 1, max: 5 })
        .withMessage('Usability rating must be between 1 and 5'),
    
    body('servicesRating')
        .notEmpty()
        .withMessage('Services rating is required')
        .isFloat({ min: 1, max: 5 })
        .withMessage('Services rating must be between 1 and 5'),
    
    body('reliabilityRating')
        .notEmpty()
        .withMessage('Reliability rating is required')
        .isFloat({ min: 1, max: 5 })
        .withMessage('Reliability rating must be between 1 and 5'),
    
    body('performanceRating')
        .notEmpty()
        .withMessage('Performance rating is required')
        .isFloat({ min: 1, max: 5 })
        .withMessage('Performance rating must be between 1 and 5'),
    
    validatorMiddleware
];

// Delete app review validator by admin
exports.deleteAppReviewValidator = [
    param('id').isMongoId().withMessage('Invalid review id'),
    validatorMiddleware
];
