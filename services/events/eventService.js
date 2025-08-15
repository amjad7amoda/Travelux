const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const Event = require('../../models/trips/eventModel');
const asyncHandler = require('../../middlewares/asyncHandler');
const { uploadSingleImage } = require('../../middlewares/uploadImageMiddleware');
const factory = require('../handlersFactory');
const ApiError = require('../../utils/apiError');

// 1-)event cover upload
exports.uploadEventImages = uploadSingleImage('cover');

//2-)image proccecing before save the image 
exports.resizeEventImages = asyncHandler(async (req, res, next) => {

    if (req.file) {
        const imageFileName = `event-${uuidv4()}-${Date.now()}-cover.jpeg`;
        await sharp(req.file.buffer)
            .resize(2000, 2000)
            .toFormat('jpeg')
            .jpeg({ quality: 100 })
            .toFile(`uploads/events/${imageFileName}`);

        req.body.cover = imageFileName;
    }

    next();
});


// 3-)Helper function to delete old logo
const deleteOldCover = async (coverFileName) => {
    const newCoverFileName = coverFileName.split('/');
    const finalNewCoverFileName = newCoverFileName[newCoverFileName.length - 1];
    
    if (coverFileName) {
        const coverPath = path.join(__dirname, '..', 'uploads', 'events', finalNewCoverFileName);
        try {
            await fs.unlink(coverPath);
        } catch (error) {
            console.error('Error deleting old cover:', error);
        }
    }
};




//5-) handlers

// @desc get list of events
// @route get /api/events
// @access public [user ,admin]
exports.getEvents = factory.GetAll(Event,'Event');

// @desc get specific event
// @route get /api/events/:id
// @access public [user, admin]
exports.getEvent = factory.GetOne(Event);

// @desc create event
// @route post /api/events
// @access private [admin]
exports.createEvent = factory.CreateOne(Event);



// @desc update specific event by the admin
// @route put /api/events/:id
// @access private [admin]
exports.updateEvent = asyncHandler(async (req, res, next) => {
    
    const event = await Event.findById(req.params.id);
    if (!event) {
        return next(new ApiError('No event found with this id', 404));
    }

    // Delete old logo if exists and new logo is being uploaded
    if (req.file && event.cover) {
        await deleteOldCover(event.cover);
    }

    const updatedEvent = await Event.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true ,runValidators: true}
    );

    res.status(200).json({
        status: "SUCCESS",
        data: updatedEvent
    });
});





