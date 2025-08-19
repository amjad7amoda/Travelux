const FlightTicket = require('../models/flightTicketModel');
const Flight = require('../models/flightModel');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/apiError');
const factory = require('./handlersFactory');
const Airline = require('../models/airlineModel');
const { createNotification } = require('./notificationService');
const Bill = require('../models/Payments/billModel');
// ********************* Middlewares ********************* //

// middleware for nested route and get all
exports.createFilterObj = asyncHandler(async (req, res, next) => {
    let filterObj = {};
    //check role of the logged user
    if(req.user.role === 'airlineOwner'){
        // find airline of the airline owner
        const airline = await Airline.findOne({ owner: req.user._id });
        filterObj = { airline: airline._id };
    }
    else if(req.user.role === 'user'){
        filterObj = { user: req.user._id };
    }
    // return just active tickets
    filterObj = { ...filterObj, status: 'active' };
    req.filteration = filterObj;
    next();
});



// ********************* functions ********************* //

// @desc Create a new ticket for a flight
// @route POST /api/flights/:flightId/tickets
// @access Private
exports.createTicket = asyncHandler(async (req, res, next) => {

    const { seats } = req.body;
    const outboundFlightId = req.params.flightId;
    const outboundFlight = await Flight.findById(outboundFlightId);
    const returnFlightId = outboundFlight.returnFlight;

    const returnFlight = await Flight.findById(returnFlightId);
    
    // Calculate final price
    let finalPrice = 0;
    seats.forEach(seat => {
        if (seat.seatNumber.startsWith('B')) {
            finalPrice += outboundFlight.priceBusiness;
            // add seat type to the seat
            seat.type = 'business';
        } else if (seat.seatNumber.startsWith('E')) {
            finalPrice += outboundFlight.priceEconomy;
            // add seat type to the seat
            seat.type = 'economy';
        }
    });

    // check seats availability and update seat map in outbound flight and return flight
    const seatMap = outboundFlight.seatMap;
    seats.forEach(seat => {
        const seatIndex = seatMap.findIndex(s => s.seatNumber === seat.seatNumber);
        if (seatIndex === -1) {
            throw new ApiError(`Seat ${seat.seatNumber} not found`, 400);
        }
        if (seatMap[seatIndex].isBooked === false) {
            seatMap[seatIndex].isBooked = true;
            seatMap[seatIndex].bookedBy = req.user._id;
        } else {
            throw new ApiError('Seat is not available', 400);
        }
    });
    outboundFlight.seatMap = seatMap;
    await outboundFlight.save();
    if(returnFlight){
        const seatMap = returnFlight.seatMap;
        seats.forEach(seat => {
            const seatIndex = seatMap.findIndex(s => s.seatNumber === seat.seatNumber);
            if (seatIndex === -1) {
                throw new ApiError(`Seat ${seat.seatNumber} not found`, 400);
            }
            if (seatMap[seatIndex].isBooked === false) {
                seatMap[seatIndex].isBooked = true;
                seatMap[seatIndex].bookedBy = req.user._id;
            } else {
                throw new ApiError('Seat is not available', 400);
            }
        });
        returnFlight.seatMap = seatMap;
        await returnFlight.save();
    }

    // Create ticket
    const ticket = await FlightTicket.create({
        outboundFlight: outboundFlightId,
        returnFlight: returnFlightId,
        bookedSeats: seats,
        finalPrice: finalPrice,
        user: req.user._id,
        airline: outboundFlight.airline._id
    });

    // send notification to the user
    await createNotification
    (req.user._id, 'Ticket Booked', `You have booked a ticket for ${outboundFlight.flightNumber}`,"flight");

    res.status(201).json({
        status: 'success',
        data: ticket,
        notification: 'Notification sent successfully'
    });
});

// @desc Get all tickets
/* 
    if user is airline owner , get all tickets for his airline
    if user is user , get all active tickets for the user
*/
// @route GET /api/flightTickets/MyTickets
// @access Private
exports.getTickets = factory.GetAll(FlightTicket,'flightTicket','airline');


// @desc get all tickets for a flight for airline owner
// @route GET /api/flightTickets/flight/:flightId/tickets
// @access Private
exports.getTicketsForFlight = asyncHandler(async (req, res, next) => {
    const flight = await Flight.findById(req.params.flightId);
    const tickets = await FlightTicket.find({ outboundFlight: flight._id });
    res.status(200).json({
        status: 'success',
        data: tickets
    });
});




 // @desc Cancel a ticket
 // @route PUT /api/flightTickets/:id/cancel
 // @access Private
 exports.cancelTicket = asyncHandler(async (req, res, next) => {
    const ticket = await FlightTicket.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    // find outbound flight and return flight and update seat map
    const outboundFlight = await Flight.findById(ticket.outboundFlight);
    const returnFlight = await Flight.findById(ticket.returnFlight);
    const seatMap = outboundFlight.seatMap;

    ticket.bookedSeats.forEach(seat => {
        const seatIndex = seatMap.findIndex(s => s.seatNumber === seat.seatNumber);
        // check if seat is booked by the user
        if(seatMap[seatIndex].bookedBy.toString() !== req.user._id.toString()){
            throw new ApiError('You are not allowed to cancel this ticket', 403);
        }
        seatMap[seatIndex].isBooked = false;
        seatMap[seatIndex].bookedBy = null;
    });
    outboundFlight.seatMap = seatMap;
    await outboundFlight.save();
    if(returnFlight){
        const seatMap = returnFlight.seatMap;
        ticket.bookedSeats.forEach(seat => {
            const seatIndex = seatMap.findIndex(s => s.seatNumber === seat.seatNumber);
            // check if seat is booked by the user
            if(seatMap[seatIndex].bookedBy.toString() !== req.user._id.toString()){
                throw new ApiError('You are not allowed to cancel this ticket', 403);
            }
            seatMap[seatIndex].isBooked = false;
            seatMap[seatIndex].bookedBy = null;
        });
        returnFlight.seatMap = seatMap;
        await returnFlight.save();
    }
    const bill = await Bill.findOne({ user: req.user._id, status: 'continous' });
    if (bill) {
        const bookingItem = bill.items.find(item => 
            item.bookingId.toString() === ticket._id.toString()
        );
   
        if (bookingItem) {
            bill.items = bill.items.filter(item => 
                item.bookingId.toString() !== ticket._id.toString()
            );
            
            bill.totalPrice -= ticket.finalPrice;
            await bill.save();
        }
    }

    // send notification to the user about ticket cancellation
    await createNotification(
        req.user._id, 
        'Ticket Cancelled', 
        `Your ticket for flight ${outboundFlight.flightNumber} has been cancelled successfully. Refund will be processed.`,
        "flight"
    );

    res.status(200).json({
        status: 'success',
        message: 'Ticket cancelled successfully'
    });
 });