const TripTicket = require('../../models/trips/tripTicketModel');
const asyncHandler = require('../../middlewares/asyncHandler');
const factory = require('../handlersFactory');
const ApiError = require('../../utils/apiError');
const Trip = require('../../models/trips/tripModel');
const Bill = require('../../models/Payments/billModel');
const { createNotification } = require('../notificationService');

// @desc get all logged user valid trip tickets
// @route GET /api/tripTickets/MyTickets
// @access Private [user]
exports.getLoggedUserValidTripTickets = asyncHandler(async (req, res, next) => {
    const tripTickets = await TripTicket.find({ user: req.user._id, status: 'valid' })
    .populate({
        path: 'trip',
        select: 'title country city price events tripCover category'
    });
    res.status(200).json({
        status: 'success',
        data: tripTickets,
    });
});

// @desc get all trip tickets for a trip
// @route GET /api/tripTickets/trip/:tripId
// @access Private [admin]
exports.getTripTicketsForTrip = asyncHandler(async (req, res, next) => {
    const tripTickets = await TripTicket.find({ trip: req.params.tripId });
    res.status(200).json({
        status: 'success',
        data: tripTickets,
    });
});

// @desc Book a ticket for a trip
// @route POST /api/tripTickets/trip
// @access Private [user]
// user send in the body the number of passengers and the tripId
exports.bookTicket = asyncHandler(async (req, res, next) => {

    const trip = await Trip.findById(req.body.tripId);
    if (!trip) {
        return next(new ApiError('Trip not found', 404));
    }

    // check if the user is already registered for the trip
    const userRegistered = trip.registeredUsers.some(user => user.userId === req.user._id);
    if (userRegistered) {
        return next(new ApiError('You are already registered for this trip', 400));
    }
        
    // Calculate total registered passengers by summing numberOfPassengers from all registeredUsers
    const totalRegisteredPassengers = trip.registeredUsers.reduce((sum, registration) => {
        return sum + registration.numberOfPassengers;
    }, 0);

    // Add new requested passengers
    const totalPassengers = totalRegisteredPassengers + req.body.numberOfPassengers;

    // Check if total would exceed maxGroupSize
    if (totalPassengers > trip.maxGroupSize) {
        return next(new ApiError('Trip cannot accommodate requested number of passengers', 400));
    }

    const totalPrice = trip.price * req.body.numberOfPassengers;
    const tripTicket = await TripTicket.create({
        trip: req.body.tripId,
        user: req.user._id,
        numberOfPassengers: req.body.numberOfPassengers,
        totalPrice: totalPrice,
    });
    
    // add the trip ticket to the trip registeredUsers array
    trip.registeredUsers.push({
        userId: req.user._id,
        tripTicketId: tripTicket._id,
        numberOfPassengers: req.body.numberOfPassengers,
    });
    await trip.save();
    
    // send notification to the user about successful booking
    await createNotification(
        req.user._id,
        'Trip Booked Successfully',
        `You have successfully booked ${req.body.numberOfPassengers} passenger(s) for trip "${trip.title}" to ${trip.city}, ${trip.country}. Total price: $${totalPrice}`,
        'trip'
    );
    
    res.status(201).json({
        status: 'success',
        data: tripTicket,
    });
});

// @desc Cancel a trip ticket
// @route PUT /api/tripTickets/:ticketId/cancel
// @access Private [user]
exports.cancelTicket = asyncHandler(async (req, res, next) => {
    const tripTicket = await TripTicket.findById(req.params.ticketId);
    if (!tripTicket) {
        return next(new ApiError('Trip ticket not found', 404));
    }

    // Check if user owns the ticket or is admin
    if (tripTicket.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return next(new ApiError('Not authorized to cancel this ticket', 403));
    }

    // Check if ticket can be cancelled
    if (tripTicket.status !== 'valid') {
        return next(new ApiError('Ticket cannot be cancelled', 400));
    }

    // Get trip details before cancellation for notification
    const trip = await Trip.findById(tripTicket.trip);
    if (!trip) {
        return next(new ApiError('Trip not found', 404));
    }

    // Update ticket status to cancelled
    tripTicket.status = 'cancelled';
    await tripTicket.save();

    // Remove the user from registeredUsers array based on tripTicketId
    trip.registeredUsers = trip.registeredUsers.filter(
        user => user.tripTicketId.toString() !== tripTicket._id.toString()
    );

    await trip.save();

    const bill = await Bill.findOne({ user: req.user._id, status: 'continous' });
    if (bill) {
        const bookingItem = bill.items.find(item => 
            item.bookingId.toString() === tripTicket._id.toString()
        );
   
        if (bookingItem) {
            bill.items = bill.items.filter(item => 
                item.bookingId.toString() !== tripTicket._id.toString()
            );
            
            bill.totalPrice -= tripTicket.totalPrice;
            await bill.save();
        }
    }

    // send notification to the user about ticket cancellation
    await createNotification(
        req.user._id,
        'Trip Ticket Cancelled',
        `Your trip ticket for "${trip.title}" to ${trip.city}, ${trip.country} has been cancelled successfully. Refund will be processed.`,
        'trip'
    );

    res.status(200).json({
        status: 'success',
        message: 'Ticket cancelled successfully',
    });
});