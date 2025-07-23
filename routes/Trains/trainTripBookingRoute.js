const express = require('express');
const router = express.Router();
const { protect } = require('../../services/authServices');
const { getAllTrainTripBookings, bookTrainTrip, updateBooking, getBookingById } = require('../../services/Trains/trainTripBookingServices');
const { createTrainTripBookingValidator, updateTrainTripBookingValidator } = require('../../utils/validators/Trains/trainTripBookingValidator');

router.get('/',
    protect,
    getAllTrainTripBookings);


router.post('/',
    protect,
    createTrainTripBookingValidator,
    bookTrainTrip
)

router.put('/:id',
    protect,
    updateTrainTripBookingValidator,
    updateBooking
)

router.get('/:id',
    protect,
    getBookingById
)
module.exports = router;