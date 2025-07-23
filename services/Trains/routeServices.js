const factory = require('../handlersFactory');
const Route = require('../../models/Trains/routeModel');
const { populate } = require('../../models/Trains/trainModel');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiError = require('../../utils/apiError');
const Station = require('../../models/Trains/stationModel')

// @desc Get all routes
// @route GET /api/routes
// @access Public
exports.getAllRoutes = factory.GetAll(Route, 'Route', {
    path: 'stations',
    populate:{
        path: 'station'
    }
});
// @desc Create a new route
// @route POST /api/routes
// @access Private (admin, routeManager)
exports.createRoute = asyncHandler( async(req, res, next) => {
    const user = req.user;
    const { name, stations, isInternational } = req.body;
    const stationIds = stations.map(s => s.station);
    for (const stationId of stationIds) {
        const station = await Station.findById(stationId);
        if (!station) {
            return next(new ApiError(`The station with ID ${stationId} is not found`, 400));
        }
    }

    let newRoute = await Route.create({
        name,
        routeManager: user._id,
        stations,
        isInternational
    });

    return res.status(201).json({
        status: 'success',
        data:{ 
            route: newRoute
        }
    });
})

// @desc Get a specific route
// @route GET /api/routes/:id
// @access Public
exports.getRoute = factory.GetOne(Route, 'stations.station');

// @desc Update a specific route
// @route PUT /api/routes/:id
// @access Private (admin, routeManager)
exports.updateRoute = factory.UpdateOne(Route);

// @desc Get the manager routes
// @route GET /api/routes/managerRoutes
// @access Private(admin, routeManager)
exports.getManagerRoutes = asyncHandler( async(req, res, next) => {
    const routes = await Route.find({}).populate('stations.station').lean();
    const user = req.user;
    if(user.role === 'admin'){
        return res.json({
            stautus: 'success',
            result: routes.length,
            routes
        })
    }
    const managerRoutes = routes.filter(route => route.routeManager.toString() == user._id.toString())

    if(managerRoutes.length == 0)
        return next(new ApiError(`You don't have routes`, 400)); 
    
    return res.json({
            stautus: 'success',
            result: managerRoutes.length,
            routes: managerRoutes
    })
})

exports.isRouteManager = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const route = await Route.findById(req.params.id);

    if (!route) {
        return next(new ApiError(`Can't find this route`, 400));
    }

    if (route.routeManager.toString() === user._id.toString() || user.role === 'admin') {
        return next();
    } else {
        return next(new ApiError(`You don't have permission to edit this route.`, 403))
    }
});