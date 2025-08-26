const express = require('express');
const {
    getTrips,
    getTrip,
    createTrip,
    updateTrip,
    deleteEventFromTrip,
    uploadTripImages,
    resizeTripImages,
    convertEventsToJson,
    calculateTripDuration,
    setEndTimeOfEachEvent,
    sortEventsAndAssignOrder,
    checkEventTimeConflicts,
    addEventToTrip,
    getStatistics1,
    getStatistics2,
    getStatistics3,
} = require('../../services/events/tripService');

const {
    getTripValidator,
    createTripValidator,
    deleteEventFromTripValidator,
    addEventToTripValidator,
} = require('../../utils/validators/trips/tripValidator');

const {protect, allowTo} = require('../../services/authServices');
const tripReviewsRoute = require('../reviews/tripReviewsRoute');

const router = express.Router();
router.use('/:tripId/tripReviews',tripReviewsRoute);

router.route('/')
    .get(protect, getTrips)
    .post(protect, allowTo('admin'),
        uploadTripImages,
        resizeTripImages,
        convertEventsToJson,
        sortEventsAndAssignOrder,
        setEndTimeOfEachEvent,
        checkEventTimeConflicts,
        calculateTripDuration,
        createTripValidator,
        createTrip
    );

// @desc get trip statistics for admin dashboard
// @route GET /api/trips/statistics1
// @access private [admin]
router.get('/statistics1', protect, allowTo('admin'), getStatistics1);

// @desc get top 4 most booked trips
// @route GET /api/trips/statistics2
// @access private [admin]
router.get('/statistics2', protect, allowTo('admin'), getStatistics2);

// @desc get revenue statistics by type (weekly, monthly, yearly)
// @route GET /api/trips/statistics3?type=weekly
// @access private [admin]
router.get('/statistics3', protect, allowTo('admin'), getStatistics3);







router.route('/:id')
    .get(protect, getTripValidator, getTrip)
    .put(protect, allowTo('admin'),uploadTripImages,resizeTripImages,updateTrip);



// @desc add event to trip by id 
//@route post /api/trips/:tripid/events
//@access private [admin]
router.post('/:tripId/events', 
    protect, allowTo('admin')
    ,addEventToTripValidator, addEventToTrip);


// @desc update trip by id
// @desc delete event from trip by id 
//@route delete /api/trips/:tripid/events/:eventid
//@access private [admin]
router.delete('/:tripId/events/:eventId', protect, allowTo('admin'),deleteEventFromTripValidator, deleteEventFromTrip);



module.exports = router;
