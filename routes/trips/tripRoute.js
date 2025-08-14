const express = require('express');
const {
    getTrips,
    getTrip,
    createTrip,
    uploadTripImages,
    resizeTripImages,
} = require('../../services/events/tripService');



const {protect, allowTo} = require('../../services/authServices');

const router = express.Router();

router.route('/').get(protect,getTrips)
                .post(protect,allowTo('admin'),uploadTripImages,resizeTripImages,createTrip);

router.route('/:id').get(protect,getTrip)




module.exports = router;
