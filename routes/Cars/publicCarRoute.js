const express = require('express');
const router = express.Router();
const handlerFactory = require('../../services/handlersFactory');
const Car = require('../../models/Cars/carModel');

router.get('/', handlerFactory.GetAll(Car, 'car'));

module.exports = router; 