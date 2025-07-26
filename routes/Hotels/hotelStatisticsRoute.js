const express = require('express');

const authService = require('../../services/authServices');

const router = express.Router();

const {
    getHotelManagerKPIs,
    getBookingStatusDistribution,
    getRoomAvailabilityStats,
    getMonthlyRevenueTrend,
    getHotelPerformanceComparison,
    getDashboardOverview
} = require('../../services/Hotels/hotelStatisticsService');

// Phase 1: Core Statistics Routes
// All routes require hotel manager authentication

// Get comprehensive dashboard overview (all Phase 1 statistics)
router.get('/dashboard/overview',
    authService.protect,
    authService.allowTo('hotelManager'),
    getDashboardOverview
);

// Get basic KPIs
router.get('/kpis',
    authService.protect,
    authService.allowTo('hotelManager'),
    getHotelManagerKPIs
);

// Get booking status distribution
router.get('/bookings/status-distribution',
    authService.protect,
    authService.allowTo('hotelManager'),
    getBookingStatusDistribution
);

// Get room availability statistics
router.get('/rooms/availability',
    authService.protect,
    authService.allowTo('hotelManager'),
    getRoomAvailabilityStats
);

// Get monthly revenue trend
router.get('/revenue/monthly-trend',
    authService.protect,
    authService.allowTo('hotelManager'),
    getMonthlyRevenueTrend
);

// Get hotel performance comparison (for managers with multiple hotels)
router.get('/hotels/performance-comparison',
    authService.protect,
    authService.allowTo('hotelManager'),
    getHotelPerformanceComparison
);

module.exports = router; 