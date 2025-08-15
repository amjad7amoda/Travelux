const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const Event = require('../../models/trips/eventModel');
const Trip = require('../../models/trips/tripModel');
const asyncHandler = require('../../middlewares/asyncHandler');
const factory = require('../handlersFactory');
const ApiError = require('../../utils/apiError');
const { uploadSingleImage } = require('../../middlewares/uploadImageMiddleware');

// 1-)trip cover upload
exports.uploadTripImages = uploadSingleImage('tripCover');

//2-)image proccecing before save the image 
exports.resizeTripImages = asyncHandler(async (req, res, next) => {

    if (req.file) {
        const imageFileName = `trip-${uuidv4()}-${Date.now()}-cover.jpeg`;
        await sharp(req.file.buffer)
            .resize(2000, 2000)
            .toFormat('jpeg')
            .jpeg({ quality: 100 })
            .toFile(`uploads/trips/${imageFileName}`);

        req.body.tripCover = imageFileName;
    }

    next();
});

// 3-)Helper function to delete old trip cover
const deleteOldTripCover = async (coverFileName) => {
    const newCoverFileName = coverFileName.split('/');
    const finalNewCoverFileName = newCoverFileName[newCoverFileName.length - 1];
    
    if (coverFileName) {
        const coverPath = path.join(__dirname, '..', 'uploads', 'trips', finalNewCoverFileName);
        try {
            await fs.unlink(coverPath);
        } catch (error) {
            console.error('Error deleting old trip cover:', error);
        }
    }
};

// @desc get list of trips
// @route get /api/trips
// @access public [user ,admin]
exports.getTrips = factory.GetAll(Trip,'Trip');

// @desc get specific trip
// @route get /api/trips/:id
// @access public [user ,admin]
exports.getTrip = factory.GetOne(Trip,'Trip');

// @desc create trip
// @route post /api/trips
// @access private [admin]
exports.createTrip = asyncHandler(async(req,res,next)=>{
    if (req.body.events) {
        const events = JSON.parse(req.body.events); 
    }
    const trip = await Trip.create(
        title
        ,description
        ,price
        ,country
        ,city
        ,maxGroupSize
        ,category
        ,guider
        ,events
        ,tripCover
    );
    res.status(201).json({data:trip});
});
