const express = require('express');
const { createTicket, getTickets, cancelTicket, createFilterObj, getTicketsForFlight } = require('../services/flightTicketService');
const { protect, allowTo } = require('../services/authServices');
const { createFlightTicketValidator, cancelFlightTicketValidator } = require('../utils/validators/flightTicketValidator');

const router = express.Router({mergeParams: true});

// Route to create a new ticket
router.route('/').post(protect, allowTo('user'), createFlightTicketValidator, createTicket);
// Route to cancel a ticket
router.route('/:id/cancel').put(protect, allowTo('user'), cancelFlightTicketValidator, cancelTicket);

// Route to get all tickets for the logged-in user
router.route('/myTickets').get(protect, allowTo('user', 'admin' , 'airlineOwner'), createFilterObj, getTickets);

// Route to get all tickets for a flight for admin
router.route('/flight/:flightId/tickets').get(protect, allowTo('airlineOwner'), getTicketsForFlight);



module.exports = router; 