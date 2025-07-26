const express = require('express');
const router = express.Router({ mergeParams: true });
const officeCarService = require('../../services/Cars/officeCarService');
const { protect, allowTo } = require('../../services/authServices');
const carValidator = require('../../utils/validators/Cars/carValidator');

// @route   GET /api/offices/cars/bookings
// @desc    Get all bookings for the office's cars
// @access  Private (Office Manager)
router.get('/bookings',
    protect,
    allowTo('officeManager', 'admin'),
    officeCarService.getOfficeBookings
);


// @route   GET /api/offices/cars/:carId
// @desc    Get a car by ID
// @access  Public
router.get('/:carId',
    officeCarService.getCarById
);

// @route   GET /api/offices/cars
// @desc    Get all cars for the office
// @access  Public
router.get('/', officeCarService.getAllCars);

// @route   POST /api/offices/cars
// @desc    Create a new car
// @access  Private (Office Manager)
router.post('/',
    protect,
    allowTo('officeManager', 'admin'),
    officeCarService.uploadCarImages,
    carValidator.createCarValidator,
    officeCarService.resizeCarImages,
    officeCarService.createCar
);

// @route   PUT /api/offices/cars/:carId
// @desc    Update a car
// @access  Private (Office Manager)
router.put('/:carId',
    protect,
    allowTo('officeManager', 'admin'),
    officeCarService.uploadCarImages,
    carValidator.updateCarValidator,
    officeCarService.resizeCarImages,
    officeCarService.updateCar
);




module.exports = router;    