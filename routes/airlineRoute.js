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
    getStatistics
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

// @route GET /api/airlines/myAirline/statistics
// @access private [airline owner]
router.get('/myAirline/statistics', protect, allowTo('airlineOwner'), getStatistics);

router.route('/:id').get(protect,getAirlineValidator,getAirline)
                    .put(protect,allowTo('admin'),uploadAirlineImages,
                    resizeAirlineImages,updateAirlineValidator,updateAirline)




module.exports = router;

