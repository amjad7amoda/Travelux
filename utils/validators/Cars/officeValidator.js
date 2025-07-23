const { body } = require('express-validator');
const CarRentalOffice = require('../../../models/Cars/carRentalOfficeModel');
const mongoose = require('mongoose');
const validatorMiddleware = require('../../../middlewares/validatorMiddleware');
const ApiError = require('../../apiError');

exports.createOfficeValidator = [
  body('name')
    .notEmpty().withMessage('Office name is required').bail()
    .isLength({ min: 3, max: 50 }).withMessage('Office name must be between 3 and 50 characters').bail()
    .custom(async (value) => {
      const office = await CarRentalOffice.findOne({ name: value });
      if (office) {
        throw new ApiError('Office name already exists', 400);
      }
      return true;
    }).bail(),
  body('country')
    .notEmpty().withMessage('Country is required').bail()
    .isLength({ min: 3, max: 50 }).withMessage('Country name must be between 3 and 50 characters').bail(),
  body('city')
    .notEmpty().withMessage('City is required').bail()
    .isLength({ min: 3, max: 50 }).withMessage('City name must be between 3 and 50 characters').bail(),
  body('address')
    .notEmpty().withMessage('Address is required').bail()
    .isLength({ min: 3, max: 100 }).withMessage('Address must be between 3 and 100 characters').bail(),
  body('phone')
    .notEmpty().withMessage('Phone is required').bail()
    .isLength({ min: 7, max: 15 }).withMessage('Phone number must be between 7 and 15 characters').bail(),
  body('coverImage')
    .optional().bail(),
  validatorMiddleware
];

exports.updateOfficeValidator = [
  body('name')
    .optional().bail()
    .isLength({ min: 3, max: 50 }).withMessage('Office name must be between 3 and 50 characters').bail()
    .custom(async (value, { req }) => {
      if (!value) return true;
      const office = await CarRentalOffice.findOne({ name: value, _id: { $ne: req.params.id } });
      if (office) {
        throw new ApiError('Office name already exists', 400);
      }
      return true;
    }).bail(),
  body('officeManager')
    .optional().bail()
    .custom((value) => !value || mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid office manager ID').bail(),
  body('country')
    .optional().bail()
    .isLength({ min: 3, max: 50 }).withMessage('Country name must be between 3 and 50 characters').bail(),
  body('city')
    .optional().bail()
    .isLength({ min: 3, max: 50 }).withMessage('City name must be between 3 and 50 characters').bail(),
  body('address')
    .optional().bail()
    .isLength({ min: 3, max: 100 }).withMessage('Address must be between 3 and 100 characters').bail(),
  body('phone')
    .optional().bail()
    .isLength({ min: 7, max: 15 }).withMessage('Phone number must be between 7 and 15 characters').bail(),
  body('coverImage')
    .optional().bail(),
  validatorMiddleware
]; 