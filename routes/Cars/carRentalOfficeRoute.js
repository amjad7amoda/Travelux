const express = require('express');
const router = express.Router();
const handlerFactory = require('../../services/handlersFactory');
const CarRentalOffice = require('../../models/Cars/carRentalOfficeModel');
const carRentalOfficeService = require('../../services/Cars/carRentalOfficeService');
const { protect, allowTo } = require('../../services/authServices');
const { createOfficeValidator, updateOfficeValidator } = require('../../utils/validators/Cars/officeValidator');
const validObjectId = require('../../middlewares/validObjectId');



router.get('/my-office',
  protect,
  allowTo('officeManager'),
  carRentalOfficeService.getMyOffice
);

// @route   GET /api/offices/statistics/top-rented-cars-by-days
// @desc    Get top ${limit} most rented cars in an office
// @access  Private (Office Manager)
router.get('/statistics/top-rented-cars-by-days',
  protect,
  allowTo('officeManager'),
  carRentalOfficeService.getTopRentedCarsByDays
);

// @route   GET /api/offices/statistics/top-rented-cars-by-bookings
// @desc    Get top ${limit} most rented cars by bookings in an office
// @access  Private (Office Manager)
router.get('/statistics/top-rented-cars-by-bookings',
  protect,
  allowTo('officeManager'),
  carRentalOfficeService.getTopRentedCarsByBookings
);

// @route   GET /api/offices/statistics/counters
// @desc    Get statistics for the car rental office (counts, revenue, trends)
// @access  Private (Office Manager)
router.get('/statistics/counters',
  protect,
  allowTo('officeManager'),
  carRentalOfficeService.getOfficeCounters
);


router.post('/',
    protect,
    allowTo('officeManager', 'admin'),
    carRentalOfficeService.uploadOfficeCoverImage,
    createOfficeValidator,
    carRentalOfficeService.resizeOfficeCoverImage,
    carRentalOfficeService.createOffice
);

router.get('/', 
    carRentalOfficeService.getAllOffices
);

router.get('/:id',
  validObjectId,
  carRentalOfficeService.getOffice
);

router.put(
  '/:id',
  validObjectId,
  protect,
  allowTo('officeManager', 'admin'),
  carRentalOfficeService.uploadOfficeCoverImage,
  updateOfficeValidator,
  carRentalOfficeService.resizeOfficeCoverImage,
  carRentalOfficeService.updateOffice
);

module.exports = router; 