const Airline = require('../models/airlineModel');
const Plane = require('../models/planeModel');
const Flight = require('../models/flightModel');
const asyncHandler = require('../middlewares/asyncHandler');
const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const {countries: europeanCountries} = require('../data/europeanCountries.json');
const {airports: europeanAirports} = require('../data/europeanAirports.json');
const ApiFeatures = require('../utils/apiFeatures');

// ****************** middlewares ******************

// middleware for  nested route and search
exports.createFilterObj = (req, res, next) => {
    let filterObj = {};
    if (req.params.airlineId) {
        filterObj = { airline: req.params.airlineId };
    }

    if (req.query.departureCity) {
        filterObj['departureAirport.city'] = req.query.departureCity;
    }
    if (req.query.arrivalCity) {
        filterObj['arrivalAirport.city'] = req.query.arrivalCity;
    }
    if (req.query.departureDate) {
        const departureDate = new Date(req.query.departureDate);
        departureDate.setHours(0, 0, 0, 0); // Set time to midnight to compare only the date
        const nextDay = new Date(departureDate);
        nextDay.setDate(departureDate.getDate() + 1);
        filterObj['departureDate'] = {
            $gte: departureDate,
            $lt: nextDay // Ensure the date matches exactly
        };
    }
    // get all flights that are pending
    filterObj['status'] = 'pending';
    req.filteration = filterObj;
    next();
};
// middleware to calculate arrival date from departure date and duration
exports.calculateArrivalDate = asyncHandler(async (req, res, next) => {
    const departureDate = new Date(req.body.departureDate);

    if(!departureDate){
        return next(new ApiError('Departure date is required', 400));
    }
    const duration = req.body.duration;
    const arrivalDate = new Date(departureDate.getTime() + duration * 60000);
    req.body.arrivalDate = arrivalDate;
    req.body.departureDate = departureDate;
    next();
});
// middleware to calculate updated arrival date from new departure date and duration
exports.calculateUpdatedArrivalDate = asyncHandler(async (req, res, next) => {
    const departureDate = new Date(req.body.departureDate);

    if(!departureDate){
        return next(new ApiError('Departure date is required', 400));
    }
    const duration = req.body.duration;
    const arrivalDate = new Date(departureDate.getTime() + duration * 60000);
    req.body.arrivalDate = arrivalDate;
    req.body.departureDate = departureDate;
    next();
});
// middleware to set the duration to body from flight if duration is not provided when updating flight
exports.setDurationToBody = asyncHandler(async (req, res, next) => {
    
    // get flight from database by id
    const flight = await Flight.findById(req.params.id);
    if(!flight){
        return next(new ApiError('Flight not found', 404));
    }
    if(!req.body.duration){
        req.body.duration = flight.duration;
    }
    next();
});
// middleware to set the departureDate to body from flight if departureDate is not provided when updating flight
exports.setdepartureDateToBody = asyncHandler(async (req, res, next) => {
    
    // get flight from database by id
    const flight = await Flight.findById(req.params.id);
    if(!flight){
        return next(new ApiError('Flight not found', 404));
    }
    if(!req.body.departureDate){
        req.body.departureDate = flight.departureDate;
    }
    next();
});

// middleware to fill code of departureCountry and arrivalCountry from europeanCountries.json according to the name
exports.fillCodeOfCountry = asyncHandler(async (req, res, next) => {
    if(!req.body.departureCountry || !req.body.arrivalCountry){
        return next(new ApiError('Departure country and arrival country are required', 400));
    }
    // check if the departureCountry and arrivalCountry is in the europeanCountries.json
    const departureCountry = europeanCountries.find(country => country.name === req.body.departureCountry);
    const arrivalCountry = europeanCountries.find(country => country.name === req.body.arrivalCountry);
    if (!departureCountry || !arrivalCountry) {
        return next(new ApiError('Country not found', 404));
    }
    // fill name and code of departureCountry and arrivalCountry
    req.body.departureCountry = {
        name: departureCountry.name,
        code: departureCountry.code
    };
    req.body.arrivalCountry = {
        name: arrivalCountry.name,
        code: arrivalCountry.code
    };
    next();
});

// middleware to fill all departureAirport and arrivalAirport data from europeanAirports.json according to the name
exports.fillAirport = asyncHandler(async (req, res, next) => {
    if(!req.body.departureAirport || !req.body.arrivalAirport){
        return next(new ApiError('Departure airport and arrival airport are required', 400));
    }
    // check if the departureAirport and arrivalAirport is in the europeanAirports.json according to the name
    // and check if the departureAirport is in the departureCountry and arrivalAirport is in the arrivalCountry
    const departureAirport = europeanAirports.find(airport => airport.name === req.body.departureAirport);
    const arrivalAirport = europeanAirports.find(airport => airport.name === req.body.arrivalAirport);

    if (!departureAirport || !arrivalAirport) {
        return next(new ApiError('Airport not found', 404));
    }
    if (departureAirport.country !== req.body.departureCountry.name || arrivalAirport.country !== req.body.arrivalCountry.name) {
        return next(new ApiError('Airport is not in the same country', 400));
    }

    // fill all departureAirport and arrivalAirport data
    req.body.departureAirport = {
        name: departureAirport.name,
        iata: departureAirport.iata,
        city: departureAirport.city,
        cityCode: departureAirport.cityCode,
        country: departureAirport.country
    };
    req.body.arrivalAirport = {
        name: arrivalAirport.name,
        iata: arrivalAirport.iata,
        city: arrivalAirport.city,
        cityCode: arrivalAirport.cityCode,
        country: arrivalAirport.country
    };
    next();
});

// middleware to fill all departureAirport and arrivalAirport data from europeanAirports.json according to the name
exports.fillAirportWhenUpdating = asyncHandler(async (req, res, next) => {
    if(req.body.departureAirport){
        const departureAirport = europeanAirports.find(airport => airport.name === req.body.departureAirport);
        if (!departureAirport) {
            return next(new ApiError('Airport not found', 404));
        }
    req.body.departureAirport = {
        name: departureAirport.name,
        iata: departureAirport.iata,
        city: departureAirport.city,
        cityCode: departureAirport.cityCode,
        country: departureAirport.country
    };
    }



    if(req.body.arrivalAirport){
    // check if the departureAirport and arrivalAirport is in the europeanAirports.json according to the name
    // and check if the departureAirport is in the departureCountry and arrivalAirport is in the arrivalCountry
    const arrivalAirport = europeanAirports.find(airport => airport.name === req.body.arrivalAirport);
    req.body.arrivalAirport = {
        name: arrivalAirport.name,
        iata: arrivalAirport.iata,
            city: arrivalAirport.city,
            cityCode: arrivalAirport.cityCode,
            country: arrivalAirport.country
        };
    }
    next();
});

// middleware to set airline id to body by airline owner before create flight
exports.setAirlineIdToBody = asyncHandler(async (req, res, next) => {
    // find airline by owner id
    const airline = await Airline.findOne({ owner: req.user._id });
    if (!airline) {
        return next(new ApiError('Airline not found', 404));
    }
    req.body.airline = airline._id;
    
    next();
});

// middleware to generate a random flight number with 2 letters and 3 numbers
exports.generateFlightNumber = asyncHandler(async (req, res, next) => {
    // generate a random flight number with 2 letters and 3 numbers like AB-123
    const flightNumber =
    Math.random().toString(36).substring(2, 4).toUpperCase() +
    Math.floor(100 + Math.random() * 900).toString();
    req.body.flightNumber = flightNumber;
    next();
});

// middleware to generate a random integer gate number from 1 to 30
exports.generateGateNumber = asyncHandler(async (req, res, next) => {
    const gateNumber = Math.floor(1 + Math.random() * 30);
    req.body.gateNumber = gateNumber;
    next();
});

/*
    middleware return error if airlineOwner trying to update:
    - airline
    - departureCountry
    - arrivalCountry
    - flightNumber
    - arrivalDate
    - arrivalCountry
    -seatMap
 */
exports.checkFlightUpdate = asyncHandler(async (req, res, next) => {
    const bannded = ['airline','departureCountry','arrivalCountry','flightNumber','arrivalDate','arrivalCountry','seatMap'];
    for(const field of bannded){
        if(req.body[field]){
            return next(new ApiError(`You are not allowed to update ${field}`, 403));
        }
    }
    next();
});

// ****************** services ******************

// @desc get all flights for all air lines or for specific airline by factory
// @route get /api/flights or /api/airlines/:airlineId/flights 
// @access public [user ,admin , airline owner]
exports.getAllFlights = asyncHandler(async (req, res, next) => {
    req.filteration = {...req.filteration, tripType: 'outbound' };    
    const countDocs = await Flight.countDocuments();
    const apiFeatures = new ApiFeatures(Flight.find(req.filteration), req.query)
        .paginate(countDocs);
    let flights = await apiFeatures.mongooseQuery;
    if (req.query.airlineName) {
        flights = flights.filter(flight => flight.airline.name === req.query.airlineName);
    }
    if(!flights){
        return next(new ApiError('No flights found', 404));
    }

    // apply filter for returnDate
    if(req.query.returnDate){
        let filteredFlights = [];
        // for each flight in flights
        for(const flight of flights){
            // find return flight
            const returnFlight = await Flight.findById(flight.returnFlight);
            // Convert both dates to same format for comparison
            const returnDate = new Date(req.query.returnDate);
            returnDate.setHours(0, 0, 0, 0); // Set time to midnight
            const flightDate = new Date(returnFlight.departureDate);
            flightDate.setHours(0, 0, 0, 0);
            
            // Compare dates using getTime() for accurate comparison
            if(flightDate.getTime() === returnDate.getTime()){
                filteredFlights.push(flight);
            }
        }
        flights = filteredFlights;
    }
    res.status(200).json({
        pagination: apiFeatures.paginateResult,
        data: flights
    });
});


// @desc get specific flight by id
// @route get /api/flights/:id 
// @access public [user ,admin , airline owner]
exports.getFlight = factory.GetOne(Flight,'airline returnFlight');




// @desc create flight
// @route post /api/airlines/MyAirline/flights
// @access private [airline owner]
exports.createFlight = asyncHandler(async (req, res, next) => {


    // 1-) get plane 
    const plane = await Plane.findById(req.body.plane);
    // 2-) generate seat map
    const seatMap = [];
    // Generate business class seats
    for (let i = 0; i < plane.seatsBusiness; i++) {
        seatMap.push({
            seatNumber: `B${i + 1}`,
            type: 'business',
            isBooked: false,
            bookedBy: null
        });
    }
    // Generate economy class seats
    for (let i = 0; i < plane.seatsEconomy; i++) {
        seatMap.push({
            seatNumber: `E${i + 1}`,
            type: 'economy',
            isBooked: false,
            bookedBy: null
        });
    }



    //Check if the plane is already booked for another flight at the same time
    const overlappingFlight = await Flight.findOne({
        plane: req.body.plane,
        $or: [
            {
                departureDate: { $lt: req.body.arrivalDate },
                arrivalDate: { $gt: req.body.departureDate }
            }
        ]
    });
    console.log(overlappingFlight);
    if (overlappingFlight) {
        return next(new ApiError('Plane is already booked for another flight at the same time', 400));
    }

    // Create outbound flight
    const outboundFlight = await Flight.create({
        plane: req.body.plane,
        airline: req.body.airline,
        flightNumber: req.body.flightNumber,
        gateNumber: req.body.gateNumber,
        departureCountry: req.body.departureCountry,
        departureAirport: req.body.departureAirport,
        departureDate: req.body.departureDate,

        arrivalCountry: req.body.arrivalCountry,
        arrivalAirport: req.body.arrivalAirport,
        arrivalDate: req.body.arrivalDate,

        priceEconomy: req.body.priceEconomy,
        priceBusiness: req.body.priceBusiness,

        duration: req.body.duration,
        seatMap: seatMap,
        tripType: 'outbound'
    });

    // Convert returnDepartureDate to a Date object
    const returnDepartureDate = new Date(req.body.returnDepartureDate);

    // Calculate return flight arrival date
    const returnArrivalDate = new Date(returnDepartureDate.getTime() + req.body.duration * 60000);

    // Generate a new flight number for the return flight
    const returnFlightNumber =
        Math.random().toString(36).substring(2, 4).toUpperCase() +
        Math.floor(100 + Math.random() * 900).toString();

    // Create return flight
    const returnFlight = await Flight.create({
        plane: req.body.plane,
        airline: req.body.airline,
        flightNumber: returnFlightNumber,
        // add 1 to the gate number
        gateNumber: req.body.gateNumber + 1,
        departureCountry: req.body.arrivalCountry, // Reverse the route
        departureAirport: req.body.arrivalAirport,
        departureDate: req.body.returnDepartureDate,

        arrivalCountry: req.body.departureCountry,
        arrivalAirport: req.body.departureAirport,
        arrivalDate: returnArrivalDate,

        priceEconomy: req.body.priceEconomy,
        priceBusiness: req.body.priceBusiness,

        duration: req.body.duration,
        seatMap: seatMap,
        tripType: 'return'
    });

    // Update outbound flight with return flight ID
    outboundFlight.returnFlight = returnFlight._id;
    await outboundFlight.save();
    //await Plane.findByIdAndUpdate(req.body.plane, { status: 'inFlight' });

    // Send response
    res.status(201).json({ data: { outboundFlight, returnFlight } });
});

// @desc update flight
// @route put /api/airlines/MyAirline/flights/:id
// @access private [airline owner]
/*
    we can update the flight by the following fields:
    - plane [ensure the new plane is available to use and has the same seats as the old plane]
    - departureAirport [ must be in the same country of the departureCountry]
    - arrivalAirport [ must be in the same country of the arrivalCountry]
    - departureDate [must be after the old departureDate with 24 hours]
    - duration
    - priceEconomy
    - priceBusiness
    - status
 */
exports.updateFlight = asyncHandler(async (req, res, next) => {
    // 1-) get flight
    const flight = await Flight.findById(req.params.id);
    // 2-) check if the flight is found
    if (!flight) {
        return next(new ApiError('Flight not found', 404));
    }
    // 3-) update flight
    const updatedFlight = await Flight.findByIdAndUpdate(req.params.id, req.body, { new: true ,runValidators: true});
    // 4-) send response
    res.status(200).json({ data: updatedFlight });
});

// @desc cancel flight
// @route put /api/airlines/MyAirline/flights/:id/cancel
// @access private [airline owner]
exports.cancelFlight = asyncHandler(async (req, res, next) => {
    // validate the flight is found and belong to the airline of the airline owner
    const airline = await Airline.findOne({ owner: req.user._id });
    if(!airline){
        return next(new ApiError('Airline not found', 404));
    }
    const flight = await Flight.findOne({ _id: req.params.id, airline: airline._id });
    if(!flight){
        return next(new ApiError('Flight not found', 404));
    }
    const updatedFlight = await Flight.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    // find return flight and update its status to cancelled
    const returnFlight = await Flight.findById(flight.returnFlight);
    if(returnFlight){
        returnFlight.status = 'cancelled';
        await returnFlight.save();
    }
    // find all tickets for the flight and update their status to cancelled
    const tickets = await FlightTicket.find({ outboundFlight: updatedFlight._id });
    tickets.forEach(async ticket => {
        ticket.status = 'cancelled';
        await ticket.save();
    });
    res.status(200).json({ message: 'Flight cancelled successfully' });
});


