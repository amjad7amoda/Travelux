const express = require('express');
const {
    getAirlines,
    getAirline,
    createAirline,
    updateAirline,
    getOwnerAirline,
    updateOwnerAirline,
    uploadAirlineImages,
    resizeAirlineImages,
    setAirlineOwner,
    getStatistics1,
    getStatistics2,
    getStatistics3
} = require('../services/airlineService');
const {
    getAirlineValidator,
    createAirlineValidator,
    updateAirlineValidator,
    updateOwnerAirlineValidator
} = require('../utils/validators/airlineValidator');    
const {protect, allowTo} = require('../services/authServices');
const flightRouter = require('./flightRoute');

const router = express.Router();

// redirect to flight route if the url is /airlines/:airlineId/flights
router.use('/:airlineId/flights', flightRouter);



router.route('/').get(protect,getAirlines)

                .post(protect,allowTo('admin','airlineOwner')
                ,uploadAirlineImages,resizeAirlineImages,
                setAirlineOwner,createAirlineValidator,createAirline);

router.route('/myAirline').get(protect,getOwnerAirline)

                .put(protect,allowTo('airlineOwner'),uploadAirlineImages,
                resizeAirlineImages,updateOwnerAirlineValidator,updateOwnerAirline);

// @route GET /api/airlines/myAirline/statistics1
// @access private [airline owner]
router.get('/myAirline/statistics1', protect, allowTo('airlineOwner'), getStatistics1);

// @route GET /api/airlines/myAirline/statistics2?year=2023
// @access private [airline owner]
router.get('/myAirline/statistics2', protect, allowTo('airlineOwner'), getStatistics2);

// @route GET /api/airlines/myAirline/statistics3?type=(weekly, monthly, yearly)
// @access private [airline owner]
// weekly: last 8 days, monthly: 4 weeks of current month, yearly: 12 months of current year
router.get('/myAirline/statistics3', protect, allowTo('airlineOwner'), getStatistics3);

router.route('/:id').get(protect,getAirlineValidator,getAirline)
                    .put(protect,allowTo('admin'),uploadAirlineImages,
                    resizeAirlineImages,updateAirlineValidator,updateAirline)




module.exports = router;

