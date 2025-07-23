const express = require('express');
const router = express.Router({ mergeParams: true });
const officeCarService = require('../../services/Cars/officeCarService');
const { protect, allowTo } = require('../../services/authServices');
const carValidator = require('../../utils/validators/Cars/carValidator');

router.get('/:carId',
    officeCarService.getCarById
);

router.get('/', officeCarService.getAllCars);

router.get('/bookings',
    protect,
    allowTo('officeManager', 'admin'),
    officeCarService.getOfficeBookings
);

router.post('/',
    protect,
    allowTo('officeManager', 'admin'),
    officeCarService.uploadCarImages,
    carValidator.createCarValidator,
    officeCarService.resizeCarImages,
    officeCarService.createCar
);

router.put('/:carId',
    protect,
    allowTo('officeManager', 'admin'),
    officeCarService.uploadCarImages,
    carValidator.updateCarValidator,
    officeCarService.resizeCarImages,
    officeCarService.updateCar
);




module.exports = router;    