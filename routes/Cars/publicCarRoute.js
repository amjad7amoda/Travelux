const express = require('express');
const router = express.Router();
const handlerFactory = require('../../services/handlersFactory');
const Car = require('../../models/Cars/carModel');
const validObjectId = require('../../middlewares/validObjectId');

// @route   GET /api/cars
// @desc    Get all cars
// @access  Public
router.get('/', handlerFactory.GetAll(Car, 'car', 'office'));

// @route   GET /api/cars/:id
// @desc    Get a car by id
// @access  Public
router.get('/:id', validObjectId, handlerFactory.GetOne(Car, 'office'));
module.exports = router; 