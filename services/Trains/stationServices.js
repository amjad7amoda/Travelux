const factory = require('../handlersFactory');
const Station = require('../../models/Trains/stationModel');
const asyncHandler = require('../../middlewares/asyncHandler');

// @desc Create a train station
// @route POST /api/stations
// @access Private (admin)
exports.createStation = factory.CreateOne(Station);

// @desc get a station information
// @route GET /api/stations/:id
// @access Public
exports.getStation = factory.GetOne(Station);

// @desc get all stations information
// @route GET /api/stations/
// @access Public
exports.getAllStations = factory.GetAll(Station, 'Station')

// @desc update a specific station
// @route PUT /api/stations/:id
// @access Private (admin)
exports.updateStation = factory.UpdateOne(Station);

// @desc update a specific station
// @route DELETE /api/stations
// @access Private (admin) 
exports.deleteStation = factory.DeleteOne(Station);

exports.getCities = asyncHandler( async (req, res) => {
    const stations = await Station.find().lean();
    const cities = [];
    stations.map(station => {
        cities.push(station.city);
    });

    return res.json({
        status: 'success',
        cities
    })
})