const express = require('express');
const {getAllCities} = require('../services/citiesServices');
const router = express.Router();
router.route('/').get(getAllCities);
module.exports = router;