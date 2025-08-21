const express = require('express');
const {
    getGuider,
    getGuiders,
    getGuiderTrips,
    createGuider,
    updateGuider
} = require('../../services/events/guiderService');

const router = express.Router();

const { protect, allowTo } = require('../../services/authServices');

router.route('/').get(protect, allowTo('admin'), getGuiders);

router.route('/').post(protect, allowTo('admin'), createGuider);

router.route('/:id').get(protect, getGuider);

router.route('/:id/trips').get(protect, getGuiderTrips);

router.route('/:id').put(protect, allowTo('admin', 'guider'), updateGuider);

module.exports = router;