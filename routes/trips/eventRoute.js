const express = require('express');
const {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    uploadEventImages,
    resizeEventImages,
} = require('../../services/events/eventService');
const {
    getEventValidator,
    createEventValidator,
    updateEventValidator,
} = require('../../utils/validators/trips/eventValidator');    
const {protect, allowTo} = require('../../services/authServices');

const router = express.Router();
    


router.route('/').get(protect,getEvents)
                .post(protect,allowTo('admin'),uploadEventImages,resizeEventImages,createEventValidator,createEvent);


router.route('/:id').get(protect,getEventValidator,getEvent)
                    .put(protect,allowTo('admin'),uploadEventImages,
                    resizeEventImages,updateEventValidator,updateEvent)




module.exports = router;

