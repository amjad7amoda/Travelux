const { body, param } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Airline = require('../../models/airlineModel');
const Plane = require('../../models/planeModel');
const User = require('../../models/userModel');
const ApiError = require('../apiError');
const { DateTime } = require('luxon');
const europeanAirports = require('../../data/europeanAirports.json');
const Flight = require('../../models/flightModel');


// create flight validator
exports.createFlightValidator = [
    // validate airline id and check if it is exist
    body('airline').notEmpty().withMessage('Airline is required')
    .isMongoId().withMessage('Invalid airline id')
    .custom(async (value, { req }) => {
        const airline = await Airline.findById(value);
        if (!airline) {
            throw new Error('Airline not found');
        }
    }),

    // validate plane id and check if it is exist and check if the plane in the same airline and check the plane status
    body('plane').notEmpty().withMessage('Plane is required')
    .isMongoId().withMessage('Invalid plane id')
    .custom(async (value, { req }) => {
        const plane = await Plane.findById(value);
        if (!plane) {
            throw new Error('Plane not found');
        }
        if (plane.airline.toString() !== req.body.airline.toString()) {
            throw new Error('Plane is not in the same airline');
        }
        if (plane.status === 'inFlight') {
            throw new Error('Plane is in flight');
        }
    }),
    
    // validate departureDate and check if it is in the future
    body('departureDate').notEmpty().withMessage('Departure date is required')
    .custom(async (value, { req }) => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid departure date');
        }
        if (date < new Date()) {
            throw new Error('Departure date is in the past');
        }
    }),

    // validate arrivalDate and check if it is in the future
    // and check if it is after the departureDate
    body('arrivalDate').notEmpty().withMessage('Arrival date is required')
    //.isDate().withMessage('Invalid arrival date')
    .custom(async (value, { req }) => {
        if (value < new Date()) {
            throw new Error('Arrival date is in the past');
        }
        if (value < req.body.departureDate) {
            throw new Error('Arrival date is before departure date');
        }
    }),
    validatorMiddleware



]
// update flight validator
exports.updateFlightValidator = [

    // check flight id is valid and belong to the airline owner ailine
    param('id').isMongoId().withMessage('Invalid flight id')
    .custom(async (value, { req }) => {
        const flight = await Flight.findById(value);
        const airline = await Airline.findOne({owner: req.user._id});
        if (!flight || flight.airline.toString() !== airline._id.toString()) {
            throw new Error('Flight not found or not belong to the airline');
        }
    }),

    // validate plane id and check if it is exist and check if the plane in the same airline and check the plane status
    // optional to update the plane
    body('plane').optional().isMongoId().withMessage('Invalid plane id')
    .custom(async (value, { req }) => {
        const flight = await Flight.findById(req.params.id);
        const airline = await Airline.findOne({owner: req.user._id});
        // check if plane is exist
        const newPlane = await Plane.findById(value);
        if (!newPlane) {
            throw new Error('Plane not found');
        }       
        // check if plane is in the same airline
        if (newPlane.airline.toString() !== airline._id.toString()) {
            throw new Error('Plane is not in the same airline');
        }
        // check plane status
        if (newPlane.status != 'availableToFlight') {
            throw new Error('Plane is not available to flight');
        }
        // find the current plane of the current flight
        const currentPlane = await Plane.findById(flight.plane);
        
        // check if plane has the same number of seats of economy and business classes
        if (newPlane.seatsEconomy !== currentPlane.seatsEconomy || newPlane.seatsBusiness !== currentPlane.seatsBusiness) {
            throw new Error('Plane has not the same number of seats of economy and business classes');
        }
    }),


    /*
    validate the departureAirport:
    - must be in the same country of the departureCountry
    - must be in the european airports from europeanAirports.json
    */
    body('departureAirport').optional().isString().withMessage('Invalid departure airport')
    .custom(async (value, { req }) => {
        const flight = await Flight.findById(req.params.id);        
        const airport = await europeanAirports.airports.find(airport => airport.name === value);
        if (!airport) {
            throw new Error('Airport not found');
        }
        // check if the airport is in the same country of the departureCountry
        if (airport.country !== flight.departureCountry.name) {
            throw new Error('Airport is not in the same country of the departureCountry');
        }
    }),

        /*
    validate the arrivalAirport:
    - must be in the same country of the arrivalCountry
    - must be in the european airports from europeanAirports.json
    */
    body('arrivalAirport').optional().isString().withMessage('Invalid arrival airport')
    .custom(async (value, { req }) => {
        const flight = await Flight.findById(req.params.id);
        const airport = await europeanAirports.airports.find(airport => airport.name === value);
        if (!airport) {
            throw new Error('Airport not found');
        }
        // check if the airport is in the same country of the arrivalCountry
        if (airport.country !== flight.arrivalCountry.name) {
            throw new Error('Airport is not in the same country of the arrivalCountry');
        }
    }),

    // validate new departureDate and check if it is after the old departureDate with 24 hours
    // validate new departureDate is a valid date
    body('departureDate').optional()
    .custom(async (value, { req }) => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid departure date');
        }
        if (date < new Date()) {
            throw new Error('Departure date is in the past');
        }
    }),

    // validate duration and check if it is a number and greater than 0
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a number and greater than 0')
    .custom(async (value, { req }) => {
        if (value < 1) {
            throw new Error('Duration must be greater than 0');
        }
    }),

    // validate priceEconomy and check if it is a number and greater than 0
    body('priceEconomy').optional().isInt({ min: 1 }).withMessage('Price economy must be a number and greater than 0')
    .custom(async (value, { req }) => {
        if (value < 1) {
            throw new Error('Price economy must be greater than 0');
        }
    }),

    // validate priceBusiness and check if it is a number and greater than 0
    body('priceBusiness').optional().isInt({ min: 1 }).withMessage('Price business must be a number and greater than 0')
    .custom(async (value, { req }) => {
        if (value < 1) {
            throw new Error('Price business must be greater than 0');
        }
    }),
    validatorMiddleware
]