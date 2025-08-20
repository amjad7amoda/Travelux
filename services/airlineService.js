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
    // if (!airline) {
    //     return next(new ApiError('You are not owner of any airline', 404));
    // }
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
//@route get /api/airlines/myAirline/statistics1
//@access private [airline owner]
exports.getStatistics1 = asyncHandler(async (req, res, next) => {
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

//@desc get monthly flight statistics for a specific year
//@route get /api/airlines/myAirline/statistics2?year=2023
//@access private [airline owner]
exports.getStatistics2 = asyncHandler(async (req, res, next) => {
    const Flight = require('../models/flightModel');
    
    // Get the airline owned by the current user
    const airline = await Airline.findOne({ owner: req.user._id });
    if (!airline) {
        return next(new ApiError('You are not owner of any airline', 404));
    }

    // Get year from query parameters, default to current year
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Validate year (reasonable range)
    if (year < 2020 || year > new Date().getFullYear() + 1) {
        return next(new ApiError('Invalid year. Please provide a year between 2020 and current year + 1', 400));
    }

    // Create array to store monthly data
    const monthlyStats = [];
    
    // Loop through all 12 months
    for (let month = 0; month < 12; month++) {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
        
        // Count flights for this month (all statuses)
        const flightsCount = await Flight.countDocuments({
            airline: airline._id,
            departureDate: { $gte: monthStart, $lte: monthEnd }
        });
        
        // Format month as YYYY-MM
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        monthlyStats.push({
            month: monthKey,
            flights: flightsCount
        });
    }

    res.status(200).json({
        status: "SUCCESS",
        data: monthlyStats
    });
});

//@desc get booking statistics by type (weekly, monthly, yearly)
//@route get /api/airlines/myAirline/statistics3?type=weekly
//@access private [airline owner]
exports.getStatistics3 = asyncHandler(async (req, res, next) => {
    const FlightTicket = require('../models/flightTicketModel');
    
    // Get the airline owned by the current user
    const airline = await Airline.findOne({ owner: req.user._id });
    if (!airline) {
        return next(new ApiError('You are not owner of any airline', 404));
    }

    // Get type from query parameters, default to 'weekly'
    const type = req.query.type || 'weekly';
    
    // Validate type
    const validTypes = ['weekly', 'monthly', 'yearly'];
    if (!validTypes.includes(type)) {
        return next(new ApiError('Invalid type. Please provide: weekly, monthly, or yearly', 400));
    }

    // Get total bookings count
    const totalBookings = await FlightTicket.countDocuments({
        airline: airline._id,
        status: { $in: ['active', 'expired', 'cancelled'] }
    });

    let periodStats = [];
    const now = new Date();

    switch (type) {
        case 'weekly':
            // Get daily stats for the last 8 days
            for (let i = 7; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
                
                const bookingsCount = await FlightTicket.countDocuments({
                    airline: airline._id,
                    status: { $in: ['active', 'expired', 'cancelled'] },
                    createdAt: { $gte: dayStart, $lte: dayEnd }
                });
                
                periodStats.push({
                    period: dayStart.toISOString().split('T')[0], // YYYY-MM-DD format
                    bookings: bookingsCount
                });
            }
            break;

        case 'monthly':
            // Get weekly stats for the current month (4 weeks)
            const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            
            // Calculate weeks in current month
            const firstWeekStart = new Date(currentMonthStart);
            firstWeekStart.setDate(firstWeekStart.getDate() - firstWeekStart.getDay()); // Start of first week
            
            for (let i = 0; i < 4; i++) {
                const weekStart = new Date(firstWeekStart);
                weekStart.setDate(weekStart.getDate() + (i * 7));
                
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);
                
                // Only include weeks that overlap with current month
                if (weekStart <= currentMonthEnd && weekEnd >= currentMonthStart) {
                    const bookingsCount = await FlightTicket.countDocuments({
                        airline: airline._id,
                        status: { $in: ['active', 'expired', 'cancelled'] },
                        createdAt: { $gte: weekStart, $lte: weekEnd }
                    });
                    
                    const weekLabel = `Week ${i+1} (${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]})`;
                    periodStats.push({
                        period: weekLabel,
                        bookings: bookingsCount
                    });
                }
            }
            break;

        case 'yearly':
            // Get monthly stats for the current year (12 months)
            for (let month = 0; month < 12; month++) {
                const monthStart = new Date(now.getFullYear(), month, 1);
                const monthEnd = new Date(now.getFullYear(), month + 1, 0, 23, 59, 59, 999);
                
                const bookingsCount = await FlightTicket.countDocuments({
                    airline: airline._id,
                    status: { $in: ['active', 'expired', 'cancelled'] },
                    createdAt: { $gte: monthStart, $lte: monthEnd }
                });
                
                const monthLabel = monthStart.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                });
                
                periodStats.push({
                    period: monthLabel,
                    bookings: bookingsCount
                });
            }
            break;
    }

    res.status(200).json({
        status: "SUCCESS",
        data: {
            totalBookings: totalBookings,
            type: type,
            periodStats: periodStats
        }
    });
});


