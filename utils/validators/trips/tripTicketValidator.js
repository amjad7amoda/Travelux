const { body , param} = require("express-validator");
const validatorMiddleware = require("../../../middlewares/validatorMiddleware");


// getTripTicketsForTrip validator
exports.getTripTicketsForTripValidator = [
    param('tripId').isMongoId().withMessage('Invalid trip id'),
    validatorMiddleware
];

// bookTicket validator
exports.bookTicketValidator = [
    param('tripId').isMongoId().withMessage('Invalid trip id'),
    body('numberOfPassengers').isInt({ min: 1 }).withMessage('Number of passengers must be at least 1'),
    validatorMiddleware
];

// cancelTicket validator
exports.cancelTicketValidator = [
    param('ticketId').isMongoId().withMessage('Invalid ticket id'),
    validatorMiddleware
];
