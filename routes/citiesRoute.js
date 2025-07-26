const express = require('express');
const {getAllCities, getAllAirports, getAllCountries} = require('../services/citiesServices');
const router = express.Router();
router.route('/cities').get(getAllCities);
router.route('/airports').get(getAllAirports);
router.route('/countries').get(getAllCountries);
module.exports = router;