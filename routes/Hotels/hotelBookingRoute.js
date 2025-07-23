const express = require('express');

const authService = require('../../services/authServices');

const router = express.Router();

const { createHotelBooking,
    getAllHotelBookings,
    getAllHotelBookingsForCurrentUser,
    getHotelBooking,
    updateHotelBooking,
    deleteHotelBooking,
    setTotalBookingPrice,
    setUserIdToBody,
    markRoomAsNotAvailable,
    markRoomAsAvailable,
    setRoomIdToBody,
    handleNoRoomChange,
    setHotelIdToBody,
    checkOwnership,
    handleRoomChange
} = require('../../services/Hotels/hotelBookingService');

const { createHotelBookingValidator,
    updateHotelBookingValidator,
    deleteHotelBookingValidator,
    bookingIdValidator
} = require('../../utils/validators/Hotels/hotelBookingValidator');

router.route('/')
    .post(authService.protect, authService.allowTo('user'),
        setTotalBookingPrice,
        setUserIdToBody,
        createHotelBookingValidator,
        markRoomAsNotAvailable,
        createHotelBooking,
        bookingIdValidator
    )
    .get(authService.protect, authService.allowTo('hotelManager'), getAllHotelBookings);

router.route('/user')
    .get(authService.protect, authService.allowTo('user'), getAllHotelBookingsForCurrentUser);

router.route('/:id')
    .get(authService.protect, authService.allowTo('user'), getHotelBooking)
    .put(authService.protect, authService.allowTo('user'),
        bookingIdValidator, // validate booking id
        checkOwnership, // check if the user is the owner of the booking
        setHotelIdToBody, // set hotel id to body using booking id
        setUserIdToBody, // set user id to body using booking id
        handleNoRoomChange, // if no room is provided, set room id to body using booking id
        updateHotelBookingValidator,
        handleRoomChange, // if room is provided, change the room to the new room and mark the old room as available
        setTotalBookingPrice,
        updateHotelBooking)
    .delete(authService.protect, authService.allowTo('user'), deleteHotelBookingValidator, markRoomAsAvailable, deleteHotelBooking);

module.exports = router;
