
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/apiError');
const {airports: europeanAirports} = require('../data/europeanAirports.json');


// @desc get all cities in european countries from europeanAirports.json
// return all cities in european countries and city code as an object
// @route get /api/cities
// @access public [user ,admin , airline owner]
exports.getAllCities = asyncHandler(async (req, res, next) => {
    const cities = europeanAirports.map(airport => ({
        city: airport.city,
        cityCode: airport.cityCode
    }));
    res.status(200).json({data: cities});
});


