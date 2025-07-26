const express = require('express');
const trainTripServices = require('../../services/Trains/trainTripServices');
const { protect, allowTo } = require('../../services/authServices');
const { createTrainTripValidator, updateTrainTripValidator } = require('../../utils/validators/Trains/trainTripValidator');
const validObjectId = require('../../middlewares/validObjectId');
const router = express.Router()

// @route GET /api/train-trips
// @access Public
router.get('/', trainTripServices.getAllTrainTrips);

// @route POST /api/train-trips
// @access Private (admin, routeManager)    
router.post('/',
    protect,
    allowTo('admin', 'routeManager'),
    createTrainTripValidator,
    trainTripServices.createTrainTrip
)

// @route GET /api/train-trips/managerTrips
// @access Private (routeManager)
router.get('/managerTrips',
    protect,
    allowTo('routeManager'),
    trainTripServices.getManagerTrips
)

// @route PUT /api/train-trips/:id
// @access Private (routeManager)
router.put('/:id',
    validObjectId,
    protect,
    allowTo('routeManager'),
    trainTripServices.isRouteManager,
    updateTrainTripValidator,
    trainTripServices.updateTrainTrip
);

// @route GET /api/train-trips/statistics/counters
// @access Private (routeManager)
router.get('/statistics/counters',
    protect,
    allowTo('routeManager'),
    trainTripServices.getCountAndRevenue
)

// @route GET /api/train-trips/statistics/ticket-sales
// @access Private (routeManager)
router.get('/statistics/ticket-sales', 
    protect,
    allowTo('routeManager'),
    trainTripServices.getTicketSalesStats);

// @route GET /api/train-trips/statistics/trip-counts
// @access Private (routeManager)
router.get('/statistics/trip-counts',
    protect,
    allowTo('routeManager'),
    trainTripServices.getTrainTripCountsStats
);

// @route GET /api/train-trips/:id
// @access Public
router.get('/:id',
    trainTripServices.getTrainTrip
);

module.exports = router;