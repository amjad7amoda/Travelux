const express = require('express');
const {createFilterObj,
    getAllFlights,
    getFlight,
    createFlight,
    generateFlightNumber,
    setAirlineIdToBody,
    fillCodeOfCountry,
    fillAirport,
    calculateArrivalDate,
    calculateUpdatedArrivalDate,
    setDurationToBody,
    setdepartureDateToBody,
    fillAirportWhenUpdating,
    checkFlightUpdate,
    updateFlight,
    cancelFlight,
    generateGateNumber
    } = require('../services/flightService');
const {createFlightValidator,updateFlightValidator} = require('../utils/validators/flightValidator');
const {protect,allowTo} = require('../services/authServices');
const flightTicketRouter = require('./flightTicketRoute');

const router = express.Router({mergeParams: true});  

router.use('/:flightId/tickets', flightTicketRouter);

router.route('/:id').get(protect,getFlight)
                    .put(protect,allowTo('airlineOwner'),checkFlightUpdate,updateFlightValidator,
                                                        setDurationToBody,
                                                        setdepartureDateToBody,
                                                        fillAirportWhenUpdating,
                                                        calculateUpdatedArrivalDate,updateFlight)
router.route('/').get(protect,createFilterObj,getAllFlights)
// cancel flight
router.route('/:id/cancel').put(protect,allowTo('airlineOwner'),cancelFlight);


// create flight
router.route('/').post(protect,allowTo('airlineOwner')
    ,setAirlineIdToBody
    ,fillCodeOfCountry
    ,fillAirport
    ,calculateArrivalDate
    ,generateFlightNumber
    ,generateGateNumber
    ,createFlightValidator
    ,createFlight)


module.exports = router;
