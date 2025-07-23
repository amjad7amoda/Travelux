const express = require('express');
const router = express.Router();
const carBookingService = require('../../services/Cars/carBookingService');
const { createCarBookingValidator, updateCarBookingValidator } = require('../../utils/validators/Cars/carBookingValidator');
const { protect, allowTo } = require('../../services/authServices');
const multer = require('multer');
const upload = multer();
const validObjectId = require('../../middlewares/validObjectId');

router.post('/bookings',
    protect,
    upload.any(),
    createCarBookingValidator, 
    carBookingService.createBooking
);

router.put('/bookings/:id',
    protect,
    validObjectId,
    upload.any(),
    updateCarBookingValidator,
    carBookingService.updateBooking
);

router.get('/bookings',
    protect,
    allowTo('admin'),
    carBookingService.getAllBookings
);

router.get('/bookings/my-bookings',
    protect,
    carBookingService.getMyBookings
);

router.get('/bookings/:id', carBookingService.getBookingById);

router.delete('/bookings/:id',
    protect,
    validObjectId,
    carBookingService.cancelBooking
);

module.exports = router; 