const asyncHandler = require('../../middlewares/asyncHandler');
const Hotel = require('../../models/Hotels/hotelModel');
const Room = require('../../models/Hotels/roomModel');
const HotelBooking = require('../../models/Hotels/hotelBookingModel');
const ApiError = require('../../utils/apiError');

// Phase 1: Core Statistics Service
class HotelStatisticsService {
    // Get basic KPIs for a specific hotel manager
    static async getHotelManagerKPIs(userId) {
        const hotels = await Hotel.find({ hotelManager: userId }, '_id');
        const hotelIds = hotels.map(hotel => hotel._id);

        if (hotelIds.length === 0) {
            return {
                totalRevenue: 0,
                totalBookings: 0,
                occupancyRate: 0,
                averageDailyRate: 0,
                revenuePerAvailableRoom: 0
            };
        }

        // Get total revenue from paid bookings
        const revenueAgg = await HotelBooking.aggregate([
            {
                $match: {
                    hotel: { $in: hotelIds },
                    status: 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalPrice' }
                }
            }
        ]);
        const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

        // Get total bookings count
        const totalBookings = await HotelBooking.countDocuments({
            hotel: { $in: hotelIds }
        });

        // Get room statistics
        const roomStats = await Room.aggregate([
            { $match: { hotel: { $in: hotelIds } } },
            {
                $group: {
                    _id: null,
                    totalRooms: { $sum: 1 },
                    availableRooms: { $sum: { $cond: ['$isAvailable', 1, 0] } },
                    averagePrice: { $avg: '$pricePerNight' }
                }
            }
        ]);

        const roomData = roomStats.length > 0 ? roomStats[0] : { totalRooms: 0, availableRooms: 0, averagePrice: 0 };
        const occupancyRate = roomData.totalRooms > 0 ?
            ((roomData.totalRooms - roomData.availableRooms) / roomData.totalRooms) * 100 : 0;

        const averageDailyRate = roomData.averagePrice || 0;
        const revenuePerAvailableRoom = roomData.totalRooms > 0 ?
            totalRevenue / roomData.totalRooms : 0;

        return {
            totalRevenue,
            totalBookings,
            occupancyRate: Math.round(occupancyRate * 100) / 100, // Round to 2 decimal places
            averageDailyRate: Math.round(averageDailyRate * 100) / 100,
            revenuePerAvailableRoom: Math.round(revenuePerAvailableRoom * 100) / 100
        };
    }

    // Get booking status distribution
    static async getBookingStatusDistribution(userId) {
        const hotels = await Hotel.find({ hotelManager: userId }, '_id');
        const hotelIds = hotels.map(hotel => hotel._id);

        if (hotelIds.length === 0) {
            return {
                pending_payment: 0,
                paid: 0,
                failed: 0
            };
        }

        const statusDistribution = await HotelBooking.aggregate([
            { $match: { hotel: { $in: hotelIds } } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = {
            pending_payment: 0,
            paid: 0,
            failed: 0
        };

        statusDistribution.forEach(item => {
            result[item._id] = item.count;
        });

        return result;
    }

    // Get room availability statistics
    static async getRoomAvailabilityStats(userId) {
        const hotels = await Hotel.find({ hotelManager: userId }, '_id');
        const hotelIds = hotels.map(hotel => hotel._id);

        if (hotelIds.length === 0) {
            return {
                totalRooms: 0,
                availableRooms: 0,
                occupiedRooms: 0,
                roomTypeDistribution: {
                    Single: { total: 0, available: 0, occupied: 0 },
                    Double: { total: 0, available: 0, occupied: 0 },
                    Suite: { total: 0, available: 0, occupied: 0 }
                }
            };
        }

        // Get overall room stats
        const overallStats = await Room.aggregate([
            { $match: { hotel: { $in: hotelIds } } },
            {
                $group: {
                    _id: null,
                    totalRooms: { $sum: 1 },
                    availableRooms: { $sum: { $cond: ['$isAvailable', 1, 0] } }
                }
            }
        ]);

        const overall = overallStats.length > 0 ? overallStats[0] : { totalRooms: 0, availableRooms: 0 };

        // Get room type distribution
        const roomTypeStats = await Room.aggregate([
            { $match: { hotel: { $in: hotelIds } } },
            {
                $group: {
                    _id: '$roomType',
                    total: { $sum: 1 },
                    available: { $sum: { $cond: ['$isAvailable', 1, 0] } }
                }
            }
        ]);

        const roomTypeDistribution = {
            Single: { total: 0, available: 0, occupied: 0 },
            Double: { total: 0, available: 0, occupied: 0 },
            Suite: { total: 0, available: 0, occupied: 0 }
        };

        roomTypeStats.forEach(stat => {
            roomTypeDistribution[stat._id] = {
                total: stat.total,
                available: stat.available,
                occupied: stat.total - stat.available
            };
        });

        return {
            totalRooms: overall.totalRooms,
            availableRooms: overall.availableRooms,
            occupiedRooms: overall.totalRooms - overall.availableRooms,
            roomTypeDistribution
        };
    }

    // Get monthly revenue trend (last 12 months)
    static async getMonthlyRevenueTrend(userId) {
        const hotels = await Hotel.find({ hotelManager: userId }, '_id');
        const hotelIds = hotels.map(hotel => hotel._id);

        if (hotelIds.length === 0) {
            return [];
        }

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const monthlyRevenue = await HotelBooking.aggregate([
            {
                $match: {
                    hotel: { $in: hotelIds },
                    status: 'paid',
                    createdAt: { $gte: twelveMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$totalPrice' },
                    bookings: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        return monthlyRevenue.map(item => ({
            year: item._id.year,
            month: item._id.month,
            revenue: item.revenue,
            bookings: item.bookings
        }));
    }

    // Get hotel performance comparison (for managers with multiple hotels)
    static async getHotelPerformanceComparison(userId) {
        const hotels = await Hotel.find({ hotelManager: userId }, 'name _id');
        const hotelIds = hotels.map(hotel => hotel._id);

        if (hotelIds.length === 0) {
            return [];
        }

        const hotelPerformance = await HotelBooking.aggregate([
            {
                $match: {
                    hotel: { $in: hotelIds },
                    status: 'paid'
                }
            },
            {
                $group: {
                    _id: '$hotel',
                    totalRevenue: { $sum: '$totalPrice' },
                    totalBookings: { $sum: 1 },
                    averageBookingValue: { $avg: '$totalPrice' }
                }
            }
        ]);

        // Get room counts for each hotel
        const hotelRoomCounts = await Room.aggregate([
            { $match: { hotel: { $in: hotelIds } } },
            {
                $group: {
                    _id: '$hotel',
                    totalRooms: { $sum: 1 },
                    availableRooms: { $sum: { $cond: ['$isAvailable', 1, 0] } }
                }
            }
        ]);

        // Combine data
        const performanceData = hotelPerformance.map(perf => {
            const hotel = hotels.find(h => h._id.toString() === perf._id.toString());
            const roomData = hotelRoomCounts.find(r => r._id.toString() === perf._id.toString()) ||
                { totalRooms: 0, availableRooms: 0 };

            const occupancyRate = roomData.totalRooms > 0 ?
                ((roomData.totalRooms - roomData.availableRooms) / roomData.totalRooms) * 100 : 0;

            return {
                hotelId: perf._id,
                hotelName: hotel ? hotel.name : 'Unknown',
                totalRevenue: perf.totalRevenue,
                totalBookings: perf.totalBookings,
                averageBookingValue: Math.round(perf.averageBookingValue * 100) / 100,
                totalRooms: roomData.totalRooms,
                occupancyRate: Math.round(occupancyRate * 100) / 100
            };
        });

        return performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue);
    }
}

// Export service functions as async handlers
exports.getHotelManagerKPIs = asyncHandler(async (req, res, next) => {
    const kpis = await HotelStatisticsService.getHotelManagerKPIs(req.user._id);

    res.status(200).json({
        status: 'SUCCESS',
        data: kpis
    });
});

exports.getBookingStatusDistribution = asyncHandler(async (req, res, next) => {
    const distribution = await HotelStatisticsService.getBookingStatusDistribution(req.user._id);

    res.status(200).json({
        status: 'SUCCESS',
        data: distribution
    });
});

exports.getRoomAvailabilityStats = asyncHandler(async (req, res, next) => {
    const stats = await HotelStatisticsService.getRoomAvailabilityStats(req.user._id);

    res.status(200).json({
        status: 'SUCCESS',
        data: stats
    });
});

exports.getMonthlyRevenueTrend = asyncHandler(async (req, res, next) => {
    const trend = await HotelStatisticsService.getMonthlyRevenueTrend(req.user._id);

    res.status(200).json({
        status: 'SUCCESS',
        data: trend
    });
});

exports.getHotelPerformanceComparison = asyncHandler(async (req, res, next) => {
    const performance = await HotelStatisticsService.getHotelPerformanceComparison(req.user._id);

    res.status(200).json({
        status: 'SUCCESS',
        data: performance
    });
});

// Get comprehensive dashboard data (combines all Phase 1 statistics)
exports.getDashboardOverview = asyncHandler(async (req, res, next) => {
    const [
        kpis,
        bookingDistribution,
        roomStats,
        revenueTrend,
        hotelPerformance
    ] = await Promise.all([
        HotelStatisticsService.getHotelManagerKPIs(req.user._id),
        HotelStatisticsService.getBookingStatusDistribution(req.user._id),
        HotelStatisticsService.getRoomAvailabilityStats(req.user._id),
        HotelStatisticsService.getMonthlyRevenueTrend(req.user._id),
        HotelStatisticsService.getHotelPerformanceComparison(req.user._id)
    ]);

    res.status(200).json({
        status: 'SUCCESS',
        data: {
            kpis,
            bookingDistribution,
            roomStats,
            revenueTrend,
            hotelPerformance
        }
    });
});

// Export the service class for potential future use
exports.HotelStatisticsService = HotelStatisticsService; 