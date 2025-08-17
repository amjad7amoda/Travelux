const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const Airline = require('../models/airlineModel');
const asyncHandler = require('../middlewares/asyncHandler');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');
const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');

// 1-)airline logo upload
exports.uploadAirlineImages = uploadSingleImage('logo');

//2-)image proccecing before save the image 
exports.resizeAirlineImages = asyncHandler(async (req, res, next) => {

    if (req.file) {
        const imageFileName = `airline-${uuidv4()}-${Date.now()}-logo.jpeg`;
        await sharp(req.file.buffer)
            .resize(2000, 2000)
            .toFormat('jpeg')
            .jpeg({ quality: 100 })
            .toFile(`uploads/airlines/${imageFileName}`);

        req.body.logo = imageFileName;
    }

    next();
});


// 3-)Helper function to delete old logo
const deleteOldLogo = async (logoFileName) => {
    const newLogoFileName = logoFileName.split('/');
    const finalNewLogoFileName = newLogoFileName[newLogoFileName.length - 1];
    
    if (logoFileName) {
        const logoPath = path.join(__dirname, '..', 'uploads', 'airlines', finalNewLogoFileName);
        try {
            await fs.unlink(logoPath);
        } catch (error) {
            console.error('Error deleting old logo:', error);
        }
    }
};


//4-) set user id to body if he is airline owner who want to create airline
exports.setAirlineOwner = asyncHandler(async (req, res, next) => {    
    if (req.user.role === 'airlineOwner' ) {
        if(req.body.owner){
            return next(new ApiError('You are not allowed to set owner',400));
        }
        req.body.owner = req.user._id;
    }
    next();
});


//5-) handlers

// @desc get list of airlines
// @route get /api/airlines
// @access public [user ,admin , airline owner]
exports.getAirlines = factory.GetAll(Airline,'Airline');

// @desc get specific airline
// @route get /api/airlines/:id
// @access public [user, admin , airline owner]
exports.getAirline = factory.GetOne(Airline);

// @desc create airline
// @route post /api/airlines
// @access private [admin , airline owner]
exports.createAirline = factory.CreateOne(Airline);



// @desc update specific airline by the admin and admin can change the owner of the airline
// @route put /api/airlines/:id
// @access private [admin]
exports.updateAirline = asyncHandler(async (req, res, next) => {
    
    const airline = await Airline.findById(req.params.id);
    if (!airline) {
        return next(new ApiError('No airline found with this id', 404));
    }

    // Delete old logo if exists and new logo is being uploaded
    if (req.file && airline.logo) {
        await deleteOldLogo(airline.logo);
    }

    const updatedAirline = await Airline.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true ,runValidators: true}
    );

    res.status(200).json({
        status: "SUCCESS",
        data: updatedAirline
    });
});

// @desc get logged in airline owner airline
// @route get /api/airlines/myAirline
// @access private [airline owner]
exports.getOwnerAirline = asyncHandler(async (req, res, next) => {
    const airline = await Airline.findOne({owner: req.user._id}).populate('planesNum');
    if (!airline) {
        return next(new ApiError('You are not owner of any airline', 404));
    }
    res.status(200).json({status:"SUCCESS",data: airline});
});


//@ update owner airline by the airline owner except the owner
// @route put /api/airlines/myAirline
// @access private [airline owner]
exports.updateOwnerAirline = asyncHandler(async (req, res, next) => {
    const airline = await Airline.findOne({owner: req.user._id});
    if (!airline) {
        return next(new ApiError('You are not owner of any airline', 404));
    }

    // Delete old logo if exists and new logo is being uploaded
    if (req.file) {
        await deleteOldLogo(airline.logo);
    }

        const updatedAirline = await Airline.findByIdAndUpdate(
            airline._id,
            req.body,
            { new: true ,runValidators: true}
        );

    res.status(200).json({
        status: "SUCCESS",
        data: updatedAirline
    });
});


//@desc get statistics
//@route get /api/airlines/myAirline/statistics
//@access private [airline owner]
exports.getStatistics = asyncHandler(async (req, res, next) => {
    const Flight = require('../models/flightModel');
    const FlightTicket = require('../models/flightTicketModel');
    
    // Get the airline owned by the current user
    const airline = await Airline.findOne({ owner: req.user._id });
    if (!airline) {
        return next(new ApiError('You are not owner of any airline', 404));
    }

    // Calculate current period (current month)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Calculate previous period (previous month)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Helper function to calculate percentage change
    const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    // Helper function to determine trend
    const getTrend = (change) => {
        if (change > 0) return 'up';
        if (change < 0) return 'down';
        return 'neutral';
    };

    // Get completed flights (successful status)
    const completedFlightsCurrent = await Flight.countDocuments({
        airline: airline._id,
        status: 'successful',
        arrivalDate: { $gte: currentMonthStart, $lte: currentMonthEnd }
    });

    const completedFlightsPrevious = await Flight.countDocuments({
        airline: airline._id,
        status: 'successful',
        arrivalDate: { $gte: previousMonthStart, $lte: previousMonthEnd }
    });

    // Get active flights (pending and onTheWay status)
    const activeFlightsCurrent = await Flight.countDocuments({
        airline: airline._id,
        status: { $in: ['pending', 'onTheWay'] },
        departureDate: { $gte: currentMonthStart, $lte: currentMonthEnd }
    });

    const activeFlightsPrevious = await Flight.countDocuments({
        airline: airline._id,
        status: { $in: ['pending', 'onTheWay'] },
        departureDate: { $gte: previousMonthStart, $lte: previousMonthEnd }
    });

    // Get cancelled flights
    const cancelledFlightsCurrent = await Flight.countDocuments({
        airline: airline._id,
        status: 'cancelled',
        updatedAt: { $gte: currentMonthStart, $lte: currentMonthEnd }
    });

    const cancelledFlightsPrevious = await Flight.countDocuments({
        airline: airline._id,
        status: 'cancelled',
        updatedAt: { $gte: previousMonthStart, $lte: previousMonthEnd }
    });

    // Get total revenue from flight tickets
    const totalRevenueCurrent = await FlightTicket.aggregate([
        {
            $match: {
                airline: airline._id,
                status: { $in: ['active', 'expired'] }, // Only count paid tickets
                paymentStatus: 'paid',
                createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$finalPrice' }
            }
        }
    ]);

    const totalRevenuePrevious = await FlightTicket.aggregate([
        {
            $match: {
                airline: airline._id,
                status: { $in: ['active', 'expired'] }, // Only count paid tickets
                paymentStatus: 'paid',
                createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$finalPrice' }
            }
        }
    ]);

    const revenueCurrent = totalRevenueCurrent[0]?.total || 0;
    const revenuePrevious = totalRevenuePrevious[0]?.total || 0;

    // Calculate changes and trends
    const completedFlightsChange = calculateChange(completedFlightsCurrent, completedFlightsPrevious);
    const activeFlightsChange = calculateChange(activeFlightsCurrent, activeFlightsPrevious);
    const cancelledFlightsChange = calculateChange(cancelledFlightsCurrent, cancelledFlightsPrevious);
    const totalRevenueChange = calculateChange(revenueCurrent, revenuePrevious);

    const stats = {
        completedFlights: {
            current: completedFlightsCurrent,
            previous: completedFlightsPrevious,
            change: Math.round(completedFlightsChange * 100) / 100,
            trend: getTrend(completedFlightsChange)
        },
        activeFlights: {
            current: activeFlightsCurrent,
            previous: activeFlightsPrevious,
            change: Math.round(activeFlightsChange * 100) / 100,
            trend: getTrend(activeFlightsChange)
        },
        cancelledFlights: {
            current: cancelledFlightsCurrent,
            previous: cancelledFlightsPrevious,
            change: Math.round(cancelledFlightsChange * 100) / 100,
            trend: getTrend(cancelledFlightsChange)
        },
        totalRevenue: {
            current: revenueCurrent,
            previous: revenuePrevious,
            change: Math.round(totalRevenueChange * 100) / 100,
            trend: getTrend(totalRevenueChange),
            currency: "USD"
        }
    };

    res.status(200).json({
        status: "SUCCESS",
        data: { stats }
    });
});


