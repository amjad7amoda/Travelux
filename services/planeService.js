const Plane = require('../models/planeModel');
const asyncHandler = require('../middlewares/asyncHandler');
const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const Airline = require('../models/airlineModel');



//1-) handlers

// @desc get all planes of logged airline owner
// @route get /api/planes/airline/myPlanes
// @access public [airline owner]
exports.getPlanesByAirline = asyncHandler(async (req, res, next) => {

    // get airline by owner id
    const airline = await Airline.findOne({owner: req.user._id});
    if (!airline) {
        return next(new ApiError('You are not owner of any airline', 404));
    }

    // get planes by airline id
    const planes = await Plane.find({airline: airline._id});
    if (!planes) {
        return next(new ApiError('you dont have any planes', 404));
    }

    res.status(200).json({status: 'SUCCESS', data: planes});
});


// @dec middleware to check if the plane is owned by the airline 
exports.checkPlaneOwnership = asyncHandler(async (req, res, next) => {

    // get airline by owner id
    const airline = await Airline.findOne({owner: req.user._id});
    if (!airline) {
        return next(new ApiError('You are not owner of any airline', 404));
    }

    // check if the plane is owned by the airline
    const plane = await Plane.findOne({_id: req.params.id, airline: airline._id});
    if (!plane) {
        return next(new ApiError('You are not owner of this plane', 404));
    }

    next();     
});

// @desc get specific plane
// @route get /api/planes/:id
// @access public [airline owner]
exports.getPlane = factory.GetOne(Plane);


// @desc set airline id to body middleware if the create plane is by airline owner
exports.setAirlineIdToBody = asyncHandler(async (req, res, next) => {
    //get airline by owner id
    const airline = await Airline.findOne({owner: req.user._id});
    if (!airline) {
    return next(new ApiError('You are not owner of any airline', 404));
    }


    // delete the airline id from the body
    if(req.body.airline){
        delete req.body.airline;
    }

    // add the airline id to the body
    req.body.airline = airline._id;

    // set current location to body
    if(!req.body.currentLocation){
        req.body.currentLocation = airline.country;
    }



    next();
});

// @desc create plane
// @route post /api/planes
// @access private [airline owner]
exports.createPlane = factory.CreateOne(Plane);


// @desc update plane
// @route put /api/planes/:id
// @access private [airline owner]
exports.updatePlane = factory.UpdateOne(Plane);


// @desc delete plane
// @route delete /api/planes/:id
// @access private [airline owner]
exports.deletePlane = factory.DeleteOne(Plane);

//@desc change plan status by plane id
//@route put /api/planes/:id/status
//@access private [airline owner]
exports.changePlaneStatus = asyncHandler(async (req, res, next) => {
    const {status} = req.body;
    const plane = await Plane.findByIdAndUpdate(req.params.id, {status}, {new: true});
    res.status(200).json({status: 'SUCCESS', data: plane});
});


