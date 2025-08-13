const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const Hotel = require('../../models/Hotels/hotelModel');
const HotelBooking = require('../../models/Hotels/hotelBookingModel');
const Room = require('../../models/Hotels/roomModel');
const asyncHandler = require('../../middlewares/asyncHandler');
const { uploadMultiImages } = require('../../middlewares/uploadImageMiddleware');
const factory = require('../handlersFactory');
const ApiError = require('../../utils/apiError');

const unlinkAsync = promisify(fs.unlink);

exports.uploadHotelImages = uploadMultiImages([
    {
        name: 'coverImage',
        maxCount: 1,
    },
    {
        name: 'images',
        maxCount: 5,
    },
]);

exports.resizeHotelImages = asyncHandler(async (req, res, next) => {
    // Initialize req.body if it doesn't exist
    req.body = req.body || {};

    // Get existing hotel data if this is an update
    let existingHotel = null;
    if (req.params.id) {
        existingHotel = await Hotel.findById(req.params.id);
        if (!existingHotel) {
            return next(new ApiError('Hotel not found', 404));
        }
    }

    // If no files were uploaded, keep existing images and proceed
    if (!req.files) {
        if (existingHotel) {
            req.body.coverImage = existingHotel.coverImage;
            req.body.images = existingHotel.images;
        }
        return next();
    }

    //1- Image processing for coverImage
    if (req.files.coverImage) {
        const imageCoverFileName = `hotel-${uuidv4()}-${Date.now()}-cover.jpeg`;

        await sharp(req.files.coverImage[0].buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 95 })
            .toFile(`uploads/hotels/${imageCoverFileName}`);

        // Save image into our db
        req.body.coverImage = imageCoverFileName;
    } else if (existingHotel) {
        // Keep existing cover image if no new one is uploaded
        req.body.coverImage = existingHotel.coverImage;
    }

    //2- Image processing for images
    if (req.files.images) {
        // Start with existing images if this is an update
        const existingImages = existingHotel ? existingHotel.images : [];

        // Process new images
        const newImages = await Promise.all(
            req.files.images.map(async (img, index) => {
                const imageName = `hotel-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

                await sharp(img.buffer)
                    .resize(2000, 1333)
                    .toFormat('jpeg')
                    .jpeg({ quality: 95 })
                    .toFile(`uploads/hotels/${imageName}`);

                return imageName;
            })
        );

        // Combine existing and new images
        req.body.images = [...existingImages, ...newImages];
    } else if (existingHotel) {
        // Keep existing images if no new ones are uploaded
        req.body.images = existingHotel.images;
    }
    next();
});

// @desc Create a new hotel 
// @route POST /api/v1/hotels
// @access Private/Hotel Manager
exports.createHotel = factory.CreateOne(Hotel);

// @desc Get all hotels
// @route GET /api/v1/hotels
// @access Public
exports.getAllHotels = factory.GetAll(Hotel);

// @desc Get specific hotel
// @route GET /api/v1/hotels/:id
// @access Public
exports.getHotel = factory.GetOne(Hotel, { path: 'rooms', match: { isActive: true } });

// @desc Get all hotels for the current manager
// @route GET /api/hotels/manager
// @access Private/Hotel Manager
exports.getCurrentManagerHotels = asyncHandler(async (req, res, next) => {
    const hotels = await Hotel.find({ hotelManager: req.user._id });
    res.status(200).json({
        status: 'SUCCESS',
        data: hotels
    });
});

// @desc Update specific hotel
// @route PUT /api/v1/hotels/:id
// @access Private/Hotel Manager
exports.updateHotel = factory.UpdateOne(Hotel);

// @desc Delete specific hotel
// @route DELETE /api/v1/hotels/:id
// @access Private/Hotel Manager
exports.deleteHotel = asyncHandler(async (req, res, next) => {
    const hotelId = req.params.id;
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
        return next(new ApiError('Hotel not found', 404));
    }

    // Check if the user is the hotel manager
    if (hotel.hotelManager.toString() !== req.user._id.toString()) {
        return next(new ApiError('You are not allowed to delete this hotel', 403));
    }

    // Check for any bookings associated with this hotel
    const bookings = await HotelBooking.find({ hotel: hotelId });

    if (bookings.length > 0) {
        return next(new ApiError('Cannot delete hotel: There are active bookings associated with this hotel', 400));
    }

    // Delete associated rooms
    await Room.deleteMany({ hotel: hotelId });

    // Delete the hotel
    await hotel.deleteOne();

    res.status(200).json({
        status: 'SUCCESS',
        message: 'Hotel and associated rooms deleted successfully'
    });
});

exports.setHotelManager = asyncHandler(async (req, res, next) => {
    req.body.hotelManager = req.user._id;
    next();
});

// @desc Delete a specific image from hotel
// @route DELETE /api/v1/hotels/:id/images/:imageName
// @access Private/Hotel Manager
exports.deleteHotelImage = asyncHandler(async (req, res, next) => {
    const { id, imageName } = req.params;

    // Find the hotel
    const hotel = await Hotel.findById(id);
    if (!hotel) {
        return next(new ApiError('Hotel not found', 404));
    }

    // Check if user is the hotel manager
    if (hotel.hotelManager.toString() !== req.user._id.toString()) {
        return next(new ApiError('You are not allowed to delete images from this hotel', 403));
    }

    // Check if the image exists in the hotel's images array
    const imageIndex = hotel.images.findIndex(img => {
        // Handle both full URLs and filenames
        const imgName = img.includes('/hotels/') ? img.split('/hotels/')[1] : img;
        return imgName === imageName;
    });

    if (imageIndex === -1) {
        return next(new ApiError('Image not found in hotel', 404));
    }

    try {
        // Delete the image file from the filesystem
        const imagePath = path.join(__dirname, '..', 'uploads', 'hotels', imageName);
        await unlinkAsync(imagePath);
    } catch (error) {
        // If file doesn't exist, just log it and continue
        console.warn('Warning: Image file not found in filesystem:', error.message);
    }

    // Remove the image from the hotel's images array
    hotel.images.splice(imageIndex, 1);
    await hotel.save();

    res.status(200).json({
        status: 'SUCCESS',
        message: 'Image deleted successfully',
        data: {
            hotel
        }
    });
});

