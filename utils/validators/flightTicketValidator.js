const { body, param } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const ApiError = require('../apiError');
const Flight = require('../../models/flightModel');
const FlightTicket = require('../../models/flightTicketModel');
// create flight ticket validator
exports.createFlightTicketValidator = [
    // validate flight id and check if it is exist
    param('flightId').notEmpty().withMessage('Flight is required')
    .isMongoId().withMessage('Invalid flight id')
    .custom(async (value, { req }) => {
        const flight = await Flight.findById(value);
        if (!flight) {
            throw new Error('Flight not found');
        }
    }),

    // validate seats and check if they are available
    body('seats').notEmpty().withMessage('Seats are required')
    .isArray().withMessage('Seats must be an array')
    .custom(async (value, { req }) => {
        // seats must start with B or E
        value.forEach(seat => {
            if (!seat.seatNumber.startsWith('B') && !seat.seatNumber.startsWith('E')) {
                throw new Error('Seat number must start with B or E');
            }
        });
        return true;
    }),
    validatorMiddleware
];

// cancel flight ticket validator
exports.cancelFlightTicketValidator = [
    param('id').notEmpty().withMessage('Ticket id is required')
    .isMongoId().withMessage('Invalid ticket id')
    .custom(async (value, { req }) => {
        const ticket = await FlightTicket.findById(value);
        if (!ticket) {
            throw new Error('Ticket not found');
        }
        // validate ticket status
        if (ticket.status !== 'active') {
            throw new Error('Ticket is not active');
        }
        return true;
    }),
    
    validatorMiddleware
];






