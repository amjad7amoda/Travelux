const express = require('express');
const trainTripServices = require('../../services/Trains/trainTripServices');
const { protect, allowTo } = require('../../services/authServices');
const { createTrainTripValidator, updateTrainTripValidator } = require('../../utils/validators/Trains/trainTripValidator');
const validObjectId = require('../../middlewares/validObjectId');
const router = express.Router()

router.get('/', trainTripServices.getAllTrainTrips);

router.post('/',
    protect,
    allowTo('admin', 'routeManager'),
    createTrainTripValidator,
    trainTripServices.createTrainTrip
)

router.get('/managerTrips',
    protect,
    allowTo('admin', 'routeManager'),
    trainTripServices.getManagerTrips
)
router.put('/:id',
    validObjectId,
    protect,
    allowTo('admin', 'routeManager'),
    trainTripServices.isRouteManager,
    updateTrainTripValidator,
    trainTripServices.updateTrainTrip
);

router.get('/statistics/ticket-sales', 
    protect,
    allowTo('admin', 'routeManager'),
    trainTripServices.getTicketSalesStats);

router.get('/statistics/counters',
    protect,
    allowTo('admin', 'routeManager'),
    // trainTripServices.isRouteManager,
    trainTripServices.getCountAndRevenue
)

router.get('/:id',
    trainTripServices.getTrainTrip
);

module.exports = router;