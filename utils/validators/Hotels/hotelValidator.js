const { check, body } = require('express-validator');
const slugify = require('slugify');
const validatorMiddleware = require('../../../middlewares/validatorMiddleware');
const Hotel = require('../../../models/Hotels/hotelModel');

exports.createHotelValidator = [
    check('name').notEmpty().withMessage('Hotel name is required')
        .isLength({ min: 3 }).withMessage('Hotel name must be at least 3 characters long')
        .isLength({ max: 30 }).withMessage('Hotel name must be less than 30 characters long')
        .custom(async (val, { req }) => {
            const existingHotel = await Hotel.findOne({ name: val });
            if (existingHotel) {
                throw new Error('Hotel name already exists');
            }
            req.body.slug = slugify(val);
            return true;
        }),
    check('stars').notEmpty().withMessage('Hotel stars are required')
        .isInt({ min: 1, max: 5 }).withMessage('Hotel stars must be between 1 and 5'),

    check('location').notEmpty().withMessage('Hotel location is required'),

    check('country').notEmpty().withMessage('Hotel country is required')
        .isLength({ min: 3 }).withMessage('Hotel country must be at least 3 characters long')
        .isLength({ max: 30 }).withMessage('Hotel country must be less than 30 characters long'),

    check('city').notEmpty().withMessage('Hotel city is required')
        .isLength({ min: 3 }).withMessage('Hotel city must be at least 3 characters long')
        .isLength({ max: 30 }).withMessage('Hotel city must be less than 30 characters long'),

    check('description').notEmpty().withMessage('Hotel description is required')
        .isLength({ min: 3 }).withMessage('Hotel description must be at least 3 characters long')
        .isLength({ max: 30 }).withMessage('Hotel description must be less than 30 characters long'),

    check('amenities').notEmpty().withMessage('Hotel amenities are required'),

    body('name').custom((val, { req }) => {
        req.body.slug = slugify(val);
        return true;
    }),
    validatorMiddleware,
];

exports.updateHotelValidator = [
    check('id').isMongoId().withMessage('Invalid hotel id'),
    body('name').optional().custom(async (val, { req }) => {
        const hotel = await Hotel.findOne({ name: val });
        if (hotel && hotel._id.toString() !== req.params.id) {
            throw new Error('Hotel name already exists');
        }
        req.body.slug = slugify(val); // Only set slug if name exists
        return true;
    }),
    body('hotelManager').custom(async (val, { req }) => {
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) throw new Error('Hotel not found');

        if (req.user._id.toString() !== hotel.hotelManager.toString()) {
            throw new Error('You are not allowed to edit this hotel');
        }

        if (val) {
            throw new Error('You are not allowed to change the hotel manager');
        }
        return true;
    }),
    validatorMiddleware,
];

exports.getHotelValidator = [
    check('id').isMongoId().withMessage('Invalid hotel id'),
    validatorMiddleware,
];

exports.deleteHotelValidator = [
    check('id').isMongoId().withMessage('Invalid hotel id'),
    body('hotelManager').custom(async (val, { req }) => {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) throw new Error('Hotel not found');

        if (req.user._id.toString() !== hotel.hotelManager.toString()) {
            throw new Error('You are not allowed to delete this hotel');
        }
        return true;
    }),
    validatorMiddleware,
];

exports.deleteHotelImageValidator = [
    check('id').isMongoId().withMessage('Invalid hotel id'),
    check('imageName').notEmpty().withMessage('Image name is required'),
    validatorMiddleware,
];

