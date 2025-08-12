const { body, check } = require('express-validator');
const User = require('../../../models/userModel');
const Hotel = require('../../../models/Hotels/hotelModel');
const Room = require('../../../models/Hotels/roomModel');
const HotelBooking = require('../../../models/Hotels/hotelBookingModel');
const validatorMiddleware = require('../../../middlewares/validatorMiddleware');

exports.createHotelBookingValidator = [
    check('user').notEmpty().withMessage('User is required')
        .isMongoId().withMessage('Invalid user id')
        .bail()
        .custom(async (val, { req }) => {
            const user = await User.findById(val);
            if (!user) {
                throw new Error('User not found');
            }
            if (user.role !== 'user') {
                throw new Error('You are not allowed to create a booking');
            }
            if (user._id.toString() !== req.user._id.toString()) {
                throw new Error('You are not allowed to create a booking for this user');
            }
            return true;
        }),
    check('hotel').notEmpty().withMessage('Hotel is required')
        .isMongoId().withMessage('Invalid hotel id')
        .bail()
        .custom(async (val, { req }) => {
            const hotel = await Hotel.findById(val);
            if (!hotel) {
                throw new Error('Hotel not found');
            }
            return true;
        }),
    check('room').notEmpty().withMessage('Room is required')
        .isMongoId().withMessage('Invalid room id')
        .bail()
        .custom(async (val, { req }) => {
            const room = await Room.findById(val);
            if (!room) {
                throw new Error('Room is not found');
            }
            if (room.hotel.toString() !== req.body.hotel.toString()) {
                throw new Error('Room is not in the hotel');
            }

            // Check for date conflicts with existing bookings
            const checkInDate = new Date(req.body.checkInDate);
            const checkOutDate = new Date(req.body.checkOutDate);

            // Find existing bookings for this room that overlap with the requested dates
            const conflictingBookings = await HotelBooking.find({
                room: val,
                status: { $in: ['active'] }, // Only check active bookings
                $or: [
                    // New booking starts during an existing booking
                    {
                        checkInDate: { $lte: checkInDate },
                        checkOutDate: { $gt: checkInDate }
                    },
                    // New booking ends during an existing booking
                    {
                        checkInDate: { $lt: checkOutDate },
                        checkOutDate: { $gte: checkOutDate }
                    },
                    // New booking completely contains an existing booking
                    {
                        checkInDate: { $gte: checkInDate },
                        checkOutDate: { $lte: checkOutDate }
                    }
                ]
            });

            if (conflictingBookings.length > 0) {
                throw new Error('Room is not available for the selected dates due to existing bookings');
            }

            return true;
        }),
    check('checkInDate').notEmpty().withMessage('Check in date is required')
        .isDate().withMessage('Invalid check in date')
        .bail()
        .custom(async (val, { req }) => {
            const checkInDate = new Date(val);
            const checkOutDate = new Date(req.body.checkOutDate);
            if (checkInDate >= checkOutDate) {
                throw new Error('Check in date must be before check out date');
            }
            const today = new Date();
            if (checkInDate < today) {
                throw new Error('Check in date must be in the future');
            }
            return true;
        }),
    check('checkOutDate').notEmpty().withMessage('Check out date is required')
        .bail()
        .isDate().withMessage('Invalid check out date')
        .bail()
        .custom(async (val, { req }) => {
            const checkInDate = new Date(req.body.checkInDate);
            const checkOutDate = new Date(val);
            if (checkOutDate <= checkInDate) {
                throw new Error('Check out date must be after check in date');
            }
            return true;
        }),
    validatorMiddleware,
];

exports.updateHotelBookingValidator = [
    check('user').notEmpty().withMessage('User is required')
        .bail()
        .isMongoId().withMessage('Invalid user id')
        .bail()
        .custom(async (val, { req }) => {
            const user = await User.findById(val);
            if (!user) {
                throw new Error('User not found');
            }
            if (user.role !== 'user') {
                throw new Error('You are not allowed to create a booking');
            }
            if (user._id.toString() !== req.user._id.toString()) {
                throw new Error('You are not allowed to create a booking for this user');
            }
            return true;
        }),
    check('hotel').notEmpty().withMessage('Hotel is required')
        .bail()
        .isMongoId().withMessage('Invalid hotel id')
        .bail()
        .custom(async (val, { req }) => {
            const hotel = await Hotel.findById(val);
            if (!hotel) {
                throw new Error('Hotel not found');
            }
            return true;
        }),
    check('room').notEmpty().withMessage('Room is required')
        .bail()
        .isMongoId().withMessage('Invalid room id')
        .bail()
        .custom(async (val, { req }) => {
            const room = await Room.findById(val);
            if (!room) {
                throw new Error('Room is not found');
            }
            if (room.hotel.toString() !== req.body.hotel.toString()) {
                throw new Error('Room is not in the hotel');
            }

            // If changing to a different room, check for date conflicts
            if (room.id.toString() !== req.body.room.toString()) {
                // Check for date conflicts with existing bookings
                const checkInDate = new Date(req.body.checkInDate);
                const checkOutDate = new Date(req.body.checkOutDate);

                // Find existing bookings for this room that overlap with the requested dates
                const conflictingBookings = await HotelBooking.find({
                    room: val,
                    _id: { $ne: req.params.id }, // Exclude current booking from conflict check
                    status: { $in: ['active'] }, // Only check active bookings
                    $or: [
                        // New booking starts during an existing booking
                        {
                            checkInDate: { $lte: checkInDate },
                            checkOutDate: { $gt: checkInDate }
                        },
                        // New booking ends during an existing booking
                        {
                            checkInDate: { $lt: checkOutDate },
                            checkOutDate: { $gte: checkOutDate }
                        },
                        // New booking completely contains an existing booking
                        {
                            checkInDate: { $gte: checkInDate },
                            checkOutDate: { $lte: checkOutDate }
                        }
                    ]
                });

                if (conflictingBookings.length > 0) {
                    throw new Error('Room is not available for the selected dates due to existing bookings');
                }
            }

            return true;
        }),
    check('checkInDate').optional()
        .isDate().withMessage('Invalid check in date')
        .bail()
        .custom(async (val, { req }) => {
            const checkInDate = new Date(val);
            const checkOutDate = new Date(req.body.checkOutDate);
            if (checkInDate >= checkOutDate) {
                throw new Error('Check in date must be before check out date');
            }
            const today = new Date();
            if (checkInDate < today) {
                throw new Error('Check in date must be in the future');
            }
            return true;
        }),
    check('checkOutDate').optional()
        .isDate().withMessage('Invalid check out date')
        .bail()
        .custom(async (val, { req }) => {
            const checkInDate = new Date(req.body.checkInDate);
            const checkOutDate = new Date(val);
            if (checkOutDate <= checkInDate) {
                throw new Error('Check out date must be after check in date');
            }
            return true;
        }),
    validatorMiddleware,
];

exports.deleteHotelBookingValidator = [
    check('id').notEmpty().withMessage('Booking id is required')
        .isMongoId().withMessage('Invalid booking id')
        .bail()
        .custom(async (val, { req }) => {
            const booking = await HotelBooking.findById(val);
            if (!booking) {
                throw new Error('Booking not found');
            }
            if (booking.user.toString() !== req.user._id.toString()) {
                throw new Error('You are not allowed to delete this booking');
            }
            return true;
        }),
    validatorMiddleware
];

exports.bookingIdValidator = [
    check('id').notEmpty().withMessage('Booking id is required')
        .bail()
        .isMongoId().withMessage('Invalid booking id')
        .bail()
        .custom(async (val, { req }) => {
            const booking = await HotelBooking.findById(val);
            if (!booking) {
                throw new Error('Booking not found');
            }
            return true;
        }),
    validatorMiddleware
];