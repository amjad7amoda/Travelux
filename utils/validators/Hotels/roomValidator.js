const mongoose = require('mongoose');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../../middlewares/validatorMiddleware');
const Room = require('../../../models/Hotels/roomModel');
const Hotel = require('../../../models/Hotels/hotelModel');

exports.createRoomValidator = [
    check('hotel').notEmpty().withMessage('Hotel is required')
        .isMongoId().withMessage('Invalid hotel ID')
        .bail()
        .custom(async (val) => {
            const hotel = await Hotel.findById(val);
            if (!hotel) throw new Error('Hotel not found');
            return true;
        }),
    check('roomType').notEmpty().withMessage('Room type is required')
        .isIn(['Single', 'Double', 'Suite']).withMessage('Invalid room type'),
    check('capacity').notEmpty().withMessage('Capacity is required')
        .isInt({ min: 1, max: 10 }).withMessage('Invalid capacity'),
    check('pricePerNight').notEmpty().withMessage('Price per night is required')
        .isFloat({ min: 1, max: 10000 }).withMessage('Invalid price per night'),
    check('amenities').notEmpty().withMessage('Amenities are required')
        .isArray().withMessage('Amenities must be an array'),
    validatorMiddleware
];

exports.getRoomValidator = [
    check('id').notEmpty().withMessage('Room ID is required')
        .isMongoId().withMessage('Invalid room ID')
        .bail()
        .custom(async (val) => {
            const room = await Room.findById(val);
            if (!room) throw new Error('Room not found');
            return true;
        }),
    check('hotelId').notEmpty().withMessage('Hotel is required')
        .isMongoId().withMessage('Invalid hotel ID')
        .bail()
        .custom(async (val) => {
            const hotel = await Hotel.findById(val);
            if (!hotel) throw new Error('Hotel not found');
            return true;
        }),
    validatorMiddleware
];

exports.getAllRoomsValidator = [
    check('hotelId')
        .custom((val, { req }) => {
            const hotelId = req.params.hotelId;
            if (!hotelId) throw new Error('Hotel ID is required');
            if (!mongoose.Types.ObjectId.isValid(hotelId)) throw new Error('Invalid hotel ID');
            return true;
        })
        .bail()
        .custom(async (val, { req }) => {
            const hotel = await Hotel.findById(req.params.hotelId);
            if (!hotel) throw new Error('Hotel not found');
            return true;
        }),
    validatorMiddleware
];

exports.updateRoomValidator = [
    check('hotelId').notEmpty().withMessage('Hotel is required')
        .isMongoId().withMessage('Invalid hotel ID')
        .bail()
        .custom(async (val) => {
            const hotel = await Hotel.findById(val);
            if (!hotel) throw new Error('Hotel not found');
            return true;
        }),
    check('hotel').notEmpty().withMessage('Hotel is required')
        .isMongoId().withMessage('Invalid hotel ID')
        .bail()
        .custom(async (val) => {
            const hotel = await Hotel.findById(val);
            if (!hotel) throw new Error('Hotel not found');
            return true;
        }),
    check('id').notEmpty().withMessage('Room ID is required')
        .isMongoId().withMessage('Invalid room ID')
        .custom(async (roomId, { req }) => {
            const room = await Room.findById(roomId);
            if (!room) throw new Error('Room not found');

            // If hotelId is in the route param, use it
            const hotelId = req.params.hotelId || req.body.hotel;

            if (!hotelId) throw new Error('Hotel ID is required for ownership validation');

            const hotel = await Hotel.findById(hotelId);
            if (!hotel) throw new Error('Hotel not found');
            if (hotel.hotelManager.toString() !== req.user._id.toString()) {
                throw new Error('You are not allowed to edit this room');
            }

            if (room.hotel.toString() !== hotelId.toString()) {
                throw new Error('This room does not belong to the specified hotel');
            }

            return true;
        }),
    check('roomType').optional()
        .isIn(['Single', 'Double', 'Suite']).withMessage('Invalid room type'),
    check('capacity').optional()
        .isInt({ min: 1, max: 10 }).withMessage('Invalid capacity'),
    check('pricePerNight').optional()
        .isFloat({ min: 1, max: 10000 }).withMessage('Invalid price per night'),
    validatorMiddleware
];

exports.deleteRoomValidator = [
    check('hotelId').notEmpty().withMessage('Hotel ID is required')
        .isMongoId().withMessage('Invalid hotel ID')
        .bail()
        .custom(async (val) => {
            const hotel = await Hotel.findById(val);
            if (!hotel) throw new Error('Hotel not found');
            return true;
        }),
    check('id').notEmpty().withMessage('Room ID is required')
        .isMongoId().withMessage('Invalid room ID')
        .bail()
        .custom(async (roomId, { req }) => {
            const room = await Room.findById(roomId);
            if (!room) throw new Error('Room not found');

            // If hotelId is in the route param, use it
            const hotelId = req.params.hotelId || req.body.hotel;

            if (!hotelId) throw new Error('Hotel ID is required for ownership validation');

            const hotel = await Hotel.findById(hotelId);
            if (!hotel) throw new Error('Hotel not found');
            if (hotel.hotelManager.toString() !== req.user._id.toString()) {
                throw new Error('You are not allowed to delete this room');
            }

            if (room.hotel.toString() !== hotelId.toString()) {
                throw new Error('This room does not belong to the specified hotel');
            }

            return true;
        }),
    validatorMiddleware
];