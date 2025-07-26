
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/apiError');
const {airports: europeanAirports} = require('../data/europeanAirports.json');
const {countries: europeanCountries} = require('../data/europeanCountries.json');

// @desc get all cities in european countries from europeanAirports.json
// return all cities in european countries and city code as an object
// @route get /api/data/cities
// @access public [user ,admin , airline owner]
exports.getAllCities = asyncHandler(async (req, res, next) => {
    const cities = europeanAirports.map(airport => ({
        city: airport.city,
        cityCode: airport.cityCode
    }));
    res.status(200).json({data: cities});
});

// @dec get all europeant airpotrs data
// @route get /api/data/airports
// @access public [user ,admin , airline owner]
exports.getAllAirports = asyncHandler(async (req, res, next) => {
    const airports = europeanAirports.map(airport => ({
        name: airport.name,
        iata: airport.iata,
        city: airport.city,
        country: airport.country,
        cityCode: airport.cityCode
    }));
    res.status(200).json({data: airports});
});

// @dec get all europeant countries
// @route get /api/data/countries
// @access public [user ,admin , airline owner]
exports.getAllCountries = asyncHandler(async (req, res, next) => {
    const countries = europeanCountries.map(country => ({
        name: country.name,
        code: country.code
    }));
    res.status(200).json({data: countries});
});


