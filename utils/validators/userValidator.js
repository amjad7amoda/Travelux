const { param,body } = require("express-validator");
const bcrypt = require('bcrypt');
const UserModel = require('../../models/userModel');
const validateMiddleware = require('../../middlewares/validatorMiddleware');
const ApiError = require('../apiError');

exports.localUserValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2-50 characters')
    .matches(/^[a-zA-Z\u0600-\u06FF\s\-']+$/).withMessage('First name can only contain letters'),
  
  body('firstName')
    .trim()
    .notEmpty().withMessage('Family name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Family name must be between 2-50 characters')
    .matches(/^[a-zA-Z\u0600-\u06FF\s\-']+$/).withMessage('Family name can only contain letters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (value) => {
      const exist = await UserModel.findOne({ email: value });
      if(exist) {
        throw new Error('Email already in use');
      }
      return true;
    }),
  
  body('password')
    .if(body('provider').equals('local') || body('provider').equals(null))
    .notEmpty().withMessage('Password is required for local accounts')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  
  // body('provider')
  //   // .notEmpty().withMessage("Please choose the provider")
  //   .isIn(['local', 'google']).withMessage('Provider must be either local or google'),

    validateMiddleware
];
  
exports.validateLogin = [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8, max: 55}),

      validateMiddleware
];

exports.googleUserValidation = [
    body('idToken')
      .notEmpty().withMessage('Google ID token is required')
      .isString().withMessage('Google ID token must be a string')
      .matches(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/]*$/)
      .withMessage('Invalid Google ID token format'),

      validateMiddleware
]

exports.loginValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),

    body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 55}).withMessage("Password must be between 8 and 55 character"),

    validateMiddleware
]
exports.updateLoggedUserValidator=[
  body('firstName')
  .optional()
  .isLength({min:3}).withMessage('too short user firstName')
  .isLength({max:32}).withMessage('too long user firstName'),

  body('lastName')
  .optional()
  .isLength({min:3}).withMessage('too short user lastName')
  .isLength({max:32}).withMessage('too long user lastName'),


  body('avatar')
  .optional(),
  validateMiddleware
];

exports.changeLoggedUserPasswordValidator=[
  body('newPassword')
  .notEmpty().withMessage('newPassword required')
  .isLength({min:8}).withMessage('newPassword must be more than 8')
  .isLength({max:32}).withMessage('newPassword must be less than 32')
  .custom((newPassword,{req})=>{;
      if(newPassword!== req.body.passwordConfirm){
          throw new ApiError('newPassword and passwordConfirm not matched',400);}
      return true;
  }),

  body('currentPassword')
  .notEmpty().withMessage('currentPassword required')
  .custom(async(currentPassword,{req})=>{
      if(!req.user)
          throw new ApiError('user not found',404);
      const currentUser = await UserModel.findById(req.user._id).select('+password');
      
      const isMatched = await bcrypt.compare(currentPassword,currentUser.password);
      if(!isMatched){
          throw new ApiError('currentPassword not true',400);}
      return true;
  }),

  body('passwordConfirm')
  .notEmpty().withMessage('passwordConfirm required'),
  validateMiddleware
];

exports.getUserValidator=[
  param('id').isMongoId().withMessage('unvalid mongo id'), validateMiddleware
];

exports.updateUserValidator=[

  body('firstName')
  .optional()
  .isLength({min:3}).withMessage('too short user firstName')
  .isLength({max:32}).withMessage('too long user firstName'),

  body('lastName')
  .optional()
  .isLength({min:3}).withMessage('too short user lastName')
  .isLength({max:32}).withMessage('too long user lastName'),
  body('profileImg')
  .optional(),

  body('email')
    .optional()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (value, { req }) => {
      if (!value) return true;
      
      // Check if email exists for another user (not the current user being updated)
      const existingUser = await UserModel.findOne({ email: value });
      if (existingUser && existingUser._id.toString() !== req.params.id) {
        throw new Error('Email already in use by another user');
      }
      return true;
    }),

  body('role')
    .optional()
    .isIn(['admin', 'supporter', 'guider', 'user', 'hotelManager', 'airlineOwner', 'routeManager', 'officeManager']).withMessage('Invalid role'),

  validateMiddleware
];