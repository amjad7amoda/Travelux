const express = require('express');
const { getAllTrainTrips, createTrainTrip, updateTrainTrip, getTrainTrip, getManagerTrips, isRouteManager } = require('../../services/Trains/trainTripServices');
const { protect, allowTo } = require('../../services/authServices');
const { createTrainTripValidator, updateTrainTripValidator } = require('../../utils/validators/Trains/trainTripValidator');
const validObjectId = require('../../middlewares/validObjectId');
const router = express.Router()

router.get('/', getAllTrainTrips);

router.post('/',
    protect,
    allowTo('admin', 'routeManager'),
    createTrainTripValidator,
    createTrainTrip
)

router.get('/managerTrips',
    protect,
    allowTo('admin', 'routeManager'),
    getManagerTrips
)
router.put('/:id',
    validObjectId,
    protect,
    allowTo('admin', 'routeManager'),
    isRouteManager,
    updateTrainTripValidator,
    updateTrainTrip
);

router.get('/:id',
    getTrainTrip
);

module.exports = router;