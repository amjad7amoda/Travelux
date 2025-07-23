const factory = require('../handlersFactory');
const Train = require('../../models/Trains/trainModel');

// @desc Create a new train
// @route POST /api/trains
// @access Private (admin)
exports.createTrain = factory.CreateOne(Train);

// @desc Get all trains
// @route GET /api/trains
// @access Public
exports.getAllTrains = factory.GetAll(Train, 'Train');

// @desc Get a specific train
// @desc GET /api/trains/:id
// @access Public
exports.getTrain = factory.GetOne(Train);


// @desc Update an exists train information
// @route PUT /api/trains/:id
// @access Private (admin)
exports.updateTrain = factory.UpdateOne(Train);

