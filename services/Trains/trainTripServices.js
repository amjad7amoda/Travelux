const factory = require('../handlersFactory');
const Station = require('../../models/Trains/stationModel');
const Route = require('../../models/Trains/routeModel')
const Train = require('../../models/Trains/trainModel');
const TrainTrip = require('../../models/Trains/trainTripModel');
const TrainTripBooking = require('../../models/Trains/trainTripBookingModel');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiFeatures = require('../../utils/apiFeatures');
const ApiError = require('../../utils/apiError');
const { calculateDistance, calculateDuration, formatMinutesToHHMM } = require('../../utils/calculate');

// @desc Get all train trips and you can search 'city=city1,city2'
// @route GET '/api/train-trips'
// @access Public
exports.getAllTrainTrips = asyncHandler(async (req, res, next) => {
    const { city, date } = req.query;
    
    const [cityA, cityB] = city 
  ? city.split(',').map(c => c.trim().toLowerCase()) 
  : [null, null];
        

    let targetDate = null;
    if (date) {
        targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            return next(new ApiError("Invalid date format", 400));
        }
    } else {
        targetDate = new Date();
        targetDate.setHours(0, 0, 0, 0);
    }

    const allTrips = await TrainTrip.find({})
        .populate({
            path: 'stations.station'
        }).lean();

    if(!city){
        return res.status(200).json({
        status: "SUCCESS",
        result: allTrips.length,
        data: {
            traintrips: allTrips
        }
    });
    }
    const matchingTrips = allTrips.filter(trip => {
        const stationCities = trip.stations.map(s => s.station?.city?.toLowerCase());
        const indexA = stationCities.indexOf(cityA);
        const indexB = stationCities.indexOf(cityB);

        const tripDeparture = new Date(trip.departureTime);

        const isDateMatch = date
            ? tripDeparture.toDateString() === targetDate.toDateString()
            : tripDeparture >= targetDate;

        return indexA !== -1 && indexB !== -1 && indexA < indexB && isDateMatch;
    }).map(tripDoc => {   
    const stationCities = tripDoc.stations.map(s => s.station?.city?.toLowerCase());
    const indexA = stationCities.indexOf(cityA);
    const indexB = stationCities.indexOf(cityB);
    const fromStation = tripDoc.stations[indexA];
    const toStation = tripDoc.stations[indexB];
    const tripDuration = toStation.arrivalOffset - fromStation.departureOffset;
    const newTrip = {
        _id: tripDoc._id,
        name: tripDoc.name,
        departureTime: tripDoc.departureTime,
        arrivalTime: tripDoc.arrivalTime,
        duration: formatMinutesToHHMM(tripDuration),
        availableSeats: tripDoc.availableSeats,
        price: tripDoc.price,
        fromStation: {
            name: fromStation?.station.name,
            country: fromStation?.station.country,
            city: fromStation?.station.city,
            code: fromStation?.station.code
        },
        toStation: {
            name: toStation?.station.name,
            country: toStation?.station.country,
            city: toStation?.station.city,
            code: toStation?.station.code
        }
    };

        return newTrip;
    });;

    if (!matchingTrips || matchingTrips.length === 0) {
        return next(new ApiError("No train trips found matching the criteria", 400));
    }

    res.status(200).json({
        status: "SUCCESS",
        result: matchingTrips.length,
        data: {
            traintrips: matchingTrips
        }
    });
});

// @desc Create a new Train Trip
// @route POST '/api/train-trips'
// @access Private (admin, routeManager)
exports.createTrainTrip = asyncHandler( async(req, res, next) => {
    const route = await Route.findById(req.body.route);
    const train = await Train.findById(req.body.train);

    if(!route)
        return next(new ApiError('This route is not founded', 400))
    if(!train)
        return next(new ApiError('This train is not found', 400));


    const trainSpeed = train.speed;
    const stopDuration = req.body.stopDuration || 5;
    const stationsDetails = await getStationsDetails(route.stations, trainSpeed, stopDuration);
    const estimatedTime = stationsDetails[route.stations.length - 1].arrivalOffset;
    const departureTime = new Date(req.body.departureTime);
    const arrivalTime = new Date(departureTime.getTime() + estimatedTime * 60000);

    //Check if there is a conflict with another trip for the same train
    const conflict = await TrainTrip.findOne({
        train: req.body.train,
        status: { $ne: 'cancelled' },
        $or: [
            {
            departureTime: { $lt: arrivalTime },
            arrivalTime: { $gt: departureTime }
            }
        ]
    });

    if (conflict) {
        return next(new ApiError('There is a conflicting trip for this train in the selected period', 400));
    }


    //Create TrainTrip
    const trainTrip = await TrainTrip.create({
        route,
        train,
        availableSeats: train.numberOfSeats,
        departureTime,
        arrivalTime,
        estimatedTime,
        estimatedTimeStr: formatMinutesToHHMM(estimatedTime),
        price: req.body.price,
        stations: stationsDetails,
        stopDuration
    });
    
    //Change train status
    train.status = 'booked';
    train.booked_until = new Date(arrivalTime.getTime() + 24 * 60 * 60000);
    await train.save();
    
    await trainTrip.populate('train stations.station');
    return res.status(201).json({
        status: 'success',
        data: {
            trainTrip
        }
    });
    
});

// @desc Update a Train Trip
// @route PUT '/api/train-trips/:id'
// @access Private (admin, routeManager)
exports.updateTrainTrip = asyncHandler(async (req, res, next) => {
    const trainTrip = await TrainTrip.findById(req.params.id);
    if (!trainTrip)
        return next(new ApiError('This train trip is not found', 400));

    const oldTrain = await Train.findById(trainTrip.train);
    let newTrain = oldTrain;

    const newDepartureTime = req.body.departureTime
        ? new Date(req.body.departureTime)
        : trainTrip.departureTime;

    // Check for new train
    if (req.body.train) {
        newTrain = await Train.findById(req.body.train);
        if (!newTrain)
            return next(new ApiError('This train is not found', 400));
    }

    //Check if the route is changed
    if (req.body.route) {
        return next(new ApiError('Editing the route is not allowed', 400));
    }

    // Apply updates
    if (req.body.departureTime) trainTrip.departureTime = newDepartureTime;
    if (req.body.price) trainTrip.price = req.body.price;
    if (req.body.stopDuration) trainTrip.stopDuration = req.body.stopDuration;


    // Recalculate stations & arrival time if route/train/departure/stop changed
    if (req.body.train || req.body.departureTime || req.body.stopDuration) {
        const route = await Route.findById(trainTrip.route);
        const stopDuration = req.body.stopDuration || trainTrip.stopDuration;

        const stationsDetails = await getStationsDetails(route.stations, newTrain.speed, stopDuration);
        const estimatedTime = stationsDetails[stationsDetails.length - 1].arrivalOffset;
        const arrivalTime = new Date(newDepartureTime.getTime() + estimatedTime * 60000);

        //Check if there is a conflict with another trip for the same train
        const conflict = await TrainTrip.findOne({
            train: newTrain._id,
            status: { $ne: 'cancelled' },
            _id: { $ne: trainTrip._id },
            $or: [{
                departureTime: { $lt: arrivalTime },
                arrivalTime: { $gt: newDepartureTime }
            }]
        });
        if (conflict) {
            return next(new ApiError('There is a conflicting trip for this train in the selected period', 400));
        }

        trainTrip.estimatedTimeStr = formatMinutesToHHMM(estimatedTime);
        trainTrip.stations = stationsDetails;
        trainTrip.estimatedTime = estimatedTime;
        trainTrip.arrivalTime = arrivalTime;
        trainTrip.train = newTrain._id;
        
        newTrain.status = 'booked';
        newTrain.booked_until = new Date(arrivalTime.getTime() + 24 * 60 * 60000);
        await newTrain.save();
    }

    await trainTrip.save();

    //Check if this is the last future trip for the old train
    const futureTrip = await TrainTrip.findOne({
        train: oldTrain._id,
        status: { $ne: 'cancelled' },
        _id: { $ne: trainTrip._id },
        departureTime: { $gt: new Date() }
    });
    if (!futureTrip) {
        oldTrain.status = 'available';
        oldTrain.booked_until = undefined;
        await oldTrain.save();
    }

    await trainTrip.populate('train stations.station');
    res.status(200).json({
        status: "success",
        data: { trainTrip }
    });
});


// @desc Get a new specific Trip
// @route GET '/api/train-trips/:id'
// @access Public
exports.getTrainTrip = factory.GetOne(TrainTrip, 'stations.station');

// @desc Get the manager train trips
// @route GET '/api/train-trips/managerTrips'
// @access Private (admin, routeManager)
exports.getManagerTrips = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const trips = await TrainTrip.find({})
        .populate([
            { path: 'route', select: 'routeManager' },
            { path: 'stations.station' } 
        ]).lean();

        if(user.role === 'admin')
            return res.json({
                status: 'success',
                result: trips.length,
                trips
            });
    
    const managerTrips = trips.filter(
        trip => trip.route?.routeManager?.toString() === user._id.toString()
    ).map(trip => {
        const firstStation = trip.stations[0].station;
        const lastStation = trip.stations[trip.stations.length - 1].station
        const newTrip = {
            _id: trip._id,
            name: trip.name,
            departureTime: trip.departureTime,
            arrivalTime: trip.arrivalTime,
            duration: trip.estimatedTimeStr,
            availableSeats: trip.availableSeats,
            price: trip.price,
            firstStation: {
                name: firstStation?.name,
                country: firstStation?.country,
                city: firstStation?.city,
                code: firstStation?.code
            },
            lastStation: {
                name: lastStation?.name,
                country: lastStation?.country,
                city: lastStation?.city,
                code: lastStation?.code
            }
        };
        
        return newTrip;
    });

    if(managerTrips.length === 0)
        return next(new ApiError(`You don't have train trips.`))

    return res.status(200).json({
        status: 'success',
        result: managerTrips.length,
        data: {
            trips: managerTrips
        }
    });
});

exports.getCountAndRevenue = asyncHandler(async (req, res, next) => {
    const user = req.user;

    const routes = await Route.find({ routeManager: user._id }, '_id');
    const routeIds = routes.map(route => route._id);
    //Completed trips
    const completedTrips = await TrainTrip.countDocuments({ 
        route: { $in: routeIds },
        status: 'completed' 
    });
    //Active trips (onWay, preparing )
    const activeTrips = await TrainTrip.countDocuments({ 
        route: { $in: routeIds },
        status: { $in: ['onWay', 'preparing'] } 
    });
    //Cancelled trips
    const cancelledTrips = await TrainTrip.countDocuments({ 
        route: { $in: routeIds },
        status: 'cancelled'
     });
    //Total revenue from paid tickets
    const revenueAgg = await TrainTripBooking.aggregate([
        { $match: { paymentStatus: 'paid', status: 'active' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    return res.json({
        status: 'success',
        data: {
            completedTrips,
            activeTrips,
            cancelledTrips,
            totalRevenue
        }
    });
});


// @desc Get the station details
// @access Private
async function getStationsDetails(routeStations, trainSpeed, stopDuration){
    const stations = [];
    for(let i = 0; i < routeStations.length; i++){
        const stationId = routeStations[i].station.toString();
        const currentStation = await Station.findById(stationId);

        if (!currentStation) {
            throw new Error(`Station not found: ${stationId}`);
        }
        
        const currentLocation = currentStation.location;
        let distanceFromPrevKm = 0;
        let arrivalOffset = 0;
        let departureOffset = stopDuration;

        if(i > 0){
            const prevStationId = routeStations[i - 1].station.toString();
            const prevStation = await Station.findById(prevStationId);
            const prevLocation = prevStation.location;

            distanceFromPrevKm = calculateDistance(
                prevLocation.latitude, prevLocation.longitude,
                currentLocation.latitude, currentLocation.longitude
            );

            const travelTime = calculateDuration(distanceFromPrevKm, trainSpeed);
            arrivalOffset = stations[i - 1].departureOffset + travelTime;

            //If the stations was not the last station
            if (i !== routeStations.length - 1) {
                departureOffset = arrivalOffset + stopDuration;
            } else {
                departureOffset = 0; //if it's the last one
            }

        }

        stations.push({
            station: stationId,
            order: i + 1,
            distanceFromPrevKm,
            arrivalOffset,
            departureOffset,
            arrivalTimeStr: formatMinutesToHHMM(arrivalOffset),
            departureTimeStr: formatMinutesToHHMM(departureOffset)
        });
    }

    return stations;
}
// @desc check if the req.user is the routeManager of this trip
// @access Private Middleware
exports.isRouteManager = asyncHandler(async (req, res, next) => {
    const tripId = req.params.id;

    if (!tripId) {
        return res.status(400).json({ message: 'Train trip ID is required' });
    }

    const trip = await TrainTrip.findById(tripId);
    if (!trip) {
        return res.status(400).json({ message: 'Train trip not found' });
    }

    const route = await Route.findById(trip.route);
    if (!route) {
        return res.status(400).json({ message: 'Associated route not found' });
    }

    if (route.routeManager.toString() !== req.user._id.toString() && req.user.role != 'admin') {
        return res.status(403).json({ message: 'You are not authorized to modify this trip' });
    }

    next();
});