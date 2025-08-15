const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const Room = require("../../models/Hotels/roomModel");
const asyncHandler = require('../../middlewares/asyncHandler');
const factory = require('../handlersFactory');
const { uploadSingleImage } = require('../../middlewares/uploadImageMiddleware');


exports.uploadRoomImage = uploadSingleImage('image');

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
    // If no file was uploaded, proceed to next middleware
    if (!req.file) {
        return next();
    }

    const filename = `room-${uuidv4()}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(600, 600)
        .toFormat('jpeg')
        .jpeg({ quality: 95 })
        .toFile(`uploads/rooms/${filename}`);

    // Save image into our db 
    req.body.image = filename;

    next();
});

// @desc Create a new room
// @route POST /api/v1/hotels/:hotelId/rooms
// @access Private/Hotel Manager
exports.createRoom = factory.CreateOne(Room);

// @desc Get all rooms
// @route GET /api/v1/hotels/:hotelId/rooms
// @access Public
exports.getAllRooms = factory.GetAll(Room);

// @desc Get a specific room
// @route GET /api/v1/hotels/:hotelId/rooms/:roomId (roomId should be written as id in the route)
// @access Public
exports.getRoom = factory.GetOne(Room);

// @desc Update a specific room
// @route PUT /api/v1/hotels/:hotelId/rooms/:roomId (roomId should be written as id in the route)
// @access Private/Hotel Manager
exports.updateRoom = factory.UpdateOne(Room);

// @desc Delete a specific room
// @route DELETE /api/v1/hotels/:hotelId/rooms/:roomId (roomId should be written as id in the route)
// @access Private/Hotel Manager
exports.deleteRoom = factory.DeleteOne(Room);

// Add hotelId to body for nested route creation
exports.setHotelIdToBody = (req, res, next) => {
    if (!req.body.hotel) req.body.hotel = req.params.hotelId;
    next();
};

exports.checkNoRoomsInHotel = (async (req, res, next) => {
    const rooms = await Room.find({ hotel: req.params.hotelId });
    if (!rooms || rooms.length === 0) {
        return res.status(200).json({
            status: 'SUCCESS', data: { rooms: [] }
        });
    }
    next();
});

exports.createFilterObj = (req, res, next) => {
    let filter = {};
    if (req.params.hotelId) {
        filter = { hotel: req.params.hotelId };
    }
    req.filteration = filter;
    next();
};



