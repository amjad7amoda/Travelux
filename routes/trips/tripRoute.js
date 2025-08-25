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
