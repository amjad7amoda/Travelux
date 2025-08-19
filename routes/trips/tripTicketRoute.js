const express = require('express');
const {
    getLoggedUserValidTripTickets,
    getTripTicketsForTrip,
    bookTicket,
    cancelTicket
} = require('../../services/events/tripTicketService');
const {
    getTripTicketsForTripValidator,
    bookTicketValidator,
    cancelTicketValidator
} = require('../../utils/validators/trips/tripTicketValidator');
const { protect, allowTo } = require('../../services/authServices');

const router = express.Router();

// @desc Get all logged user valid trip tickets
// @route GET /api/tripTickets  /MyTickets
// @access Private [user]
router.get('/MyTickets', protect, allowTo('user'), getLoggedUserValidTripTickets);

// @desc Get all trip tickets for a trip
// @route GET /api/tripTickets  /trip/:tripId
// @access Private [admin]
router.get('/trip/:tripId', protect, allowTo('admin'), getTripTicketsForTripValidator, getTripTicketsForTrip);

// @desc Book a ticket for a trip
// @route POST /api/tripTickets  /trip
// @access Private [user]
router.post('/trip', protect, allowTo('user'), bookTicketValidator, bookTicket);

// @desc Cancel a trip ticket
// @route PUT /api/tripTickets  /:ticketId/cancel
// @access Private [user]
router.put('/:ticketId/cancel', protect, allowTo('user'), cancelTicketValidator, cancelTicket);

module.exports = router;
