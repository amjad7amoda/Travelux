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

// @desc Get the count and revenue of the train trips
// @route GET '/api/train-trips/statistics/counters'
// @access Private (admin, routeManager)
exports.getCountAndRevenue = asyncHandler(async (req, res, next) => {
    const user = req.user;

    const routes = await Route.find({ routeManager: user._id }, '_id');
    const routeIds = routes.map(route => route._id);

    const trips = await TrainTrip.countDocuments({ route: { $in: routeIds } });
    console.log(trips);
    //Calculate the start and end dates of the current and previous months
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Completed Trips
    const completedCurrent = await TrainTrip.countDocuments({
        route: { $in: routeIds },
        status: 'completed',
        createdAt: { $gte: startOfCurrentMonth, $lte: now }
    });

    const completedPrevious = await TrainTrip.countDocuments({
        route: { $in: routeIds },
        status: 'completed',
        createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
    });
    let completedChange = 0;
    if (completedPrevious > 0) {
        completedChange = ((completedCurrent - completedPrevious) / completedPrevious) * 100;
    } else if (completedCurrent > 0) {
        completedChange = 100;
    }
    completedChange = Math.round(completedChange * 100) / 100;
    let completedTrend = 'neutral';
    if (completedChange > 0) completedTrend = 'up';
    else if (completedChange < 0) completedTrend = 'down';

    // Active Trips (onWay, preparing)
    const activeCurrent = await TrainTrip.countDocuments({
        route: { $in: routeIds },
        status: { $in: ['onWay', 'preparing'] }
    });

    // Cancelled Trips
    const cancelledCurrent = await TrainTrip.countDocuments({
        route: { $in: routeIds },
        status: 'cancelled',
        createdAt: { $gte: startOfCurrentMonth, $lte: now }
    });
    const cancelledPrevious = await TrainTrip.countDocuments({
        route: { $in: routeIds },
        status: 'cancelled',
        createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
    });
    let cancelledChange = 0;
    if (cancelledPrevious > 0) {
        cancelledChange = ((cancelledCurrent - cancelledPrevious) / cancelledPrevious) * 100;
    } else if (cancelledCurrent > 0) {
        cancelledChange = 100;
    }
    cancelledChange = Math.round(cancelledChange * 100) / 100;
    let cancelledTrend = 'neutral';
    if (cancelledChange > 0) cancelledTrend = 'up';
    else if (cancelledChange < 0) cancelledTrend = 'down';

    // Total revenue (paid tickets)
    const revenueCurrentAgg = await TrainTripBooking.aggregate([
        { $match: { paymentStatus: 'paid', status: 'active', createdAt: { $gte: startOfCurrentMonth, $lte: now } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const revenuePreviousAgg = await TrainTripBooking.aggregate([
        { $match: { paymentStatus: 'paid', status: 'active', createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const revenueCurrent = revenueCurrentAgg.length > 0 ? revenueCurrentAgg[0].total : 0;
    const revenuePrevious = revenuePreviousAgg.length > 0 ? revenuePreviousAgg[0].total : 0;
    let revenueChange = 0;
    if (revenuePrevious > 0) {
        revenueChange = ((revenueCurrent - revenuePrevious) / revenuePrevious) * 100;
    } else if (revenueCurrent > 0) {
        revenueChange = 100;
    }
    revenueChange = Math.round(revenueChange * 100) / 100;
    let revenueTrend = 'neutral';
    if (revenueChange > 0) revenueTrend = 'up';
    else if (revenueChange < 0) revenueTrend = 'down';


    
    return res.json({
        status: 'success',
        data: {
            completedTrips: {
                current: completedCurrent,
                previous: completedPrevious,
                change: completedChange,
                trend: completedTrend
            },
            activeTrips: activeCurrent,
            cancelledTrips: {
                current: cancelledCurrent,
                previous: cancelledPrevious,
                change: cancelledChange,
                trend: cancelledTrend
            },
            totalRevenue: {
                current: revenueCurrent,
                previous: revenuePrevious,
                change: revenueChange,
                trend: revenueTrend
            }
        }
    });
});

// @desc Get ticket sales stats (by day in week or by week in month)
// @route GET /api/train-trips/statistics/ticket-sales?period=week|month
// @access Private (admin, routeManager)
exports.getTicketSalesStats = asyncHandler(async (req, res, next) => {
    const period = req.query.period || 'week'; // default: week
    const user = req.user;

    let labels = [];
    let data = [];
    let match = {};

    // If the user is routeManager, filter the bookings by the trips he manages
    if (user.role !== 'admin') {
        const routes = await Route.find({ routeManager: user._id }, '_id');
        const routeIds = routes.map(route => route._id);
        const trips = await TrainTrip.find({ route: { $in: routeIds } }, '_id');
        const tripIds = trips.map(trip => trip._id);
        match.trainTrip = { $in: tripIds };
    }

    if (period === 'week') {
        // احسب بداية ونهاية الأسبوع الحالي (الأحد إلى السبت)
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0,0,0,0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        match.createdAt = { $gte: startOfWeek, $lt: endOfWeek };

        // اجمع عدد التذاكر لكل يوم
        const ticketsPerDay = await TrainTripBooking.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" }, // 1=Sunday, 7=Saturday
                    count: { $sum: 1 }
                }
            }
        ]);

        // جهز النتائج مرتبة من الأحد إلى السبت
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        labels = days;
        data = Array(7).fill(0);
        ticketsPerDay.forEach(item => {
            // Mongo: 1=Sunday, JS: 0=Sunday
            data[item._id - 1] = item.count;
        });

    } else if (period === 'month') {
        // احسب بداية ونهاية الشهر الحالي
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        match.createdAt = { $gte: startOfMonth, $lt: endOfMonth };

        // اجمع عدد التذاكر لكل أسبوع
        const ticketsPerWeek = await TrainTripBooking.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        $ceil: {
                            $divide: [
                                { $add: [{ $dayOfMonth: "$createdAt" }, 6] },
                                7
                            ]
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // جهز النتائج 4 أسابيع
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        data = Array(4).fill(0);
        ticketsPerWeek.forEach(item => {
            if (item._id >= 1 && item._id <= 4) {
                data[item._id - 1] = item.count;
            }
        });
    } else {
        return next(new ApiError('Invalid period. Use week or month.', 400));
    }

    // مجموع التذاكر
    const total = data.reduce((a, b) => a + b, 0);

    return res.json({
        status: 'success',
        period,
        totalTickets: total,
        labels,
        data
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