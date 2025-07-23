const express = require('express');
const authService = require('../../services/authServices');

const router = express.Router({ mergeParams: true }); // Enable mergeParams to access parent route params

const {
    setHotelIdToBody,
    createRoom,
    getAllRooms,
    getRoom,
    updateRoom,
    deleteRoom,
    createFilterObj,
    uploadRoomImage,
    resizeImage
} = require('../../services/Hotels/roomService');

const { createRoomValidator,
    getRoomValidator,
    getAllRoomsValidator,
    updateRoomValidator,
    deleteRoomValidator } = require('../../utils/validators/Hotels/roomValidator');

router.route('/')
    .post(authService.protect, authService.allowTo('hotelManager'),
        uploadRoomImage,
        resizeImage,
        setHotelIdToBody,
        createRoomValidator,
        createRoom)
    .get(createFilterObj, getAllRoomsValidator, getAllRooms);

router.route('/:id')
    .get(createFilterObj, getRoomValidator, getRoom)
    .put(authService.protect, authService.allowTo('hotelManager'),
        uploadRoomImage,
        resizeImage,
        setHotelIdToBody,
        updateRoomValidator,
        updateRoom)
    .delete(authService.protect, authService.allowTo('hotelManager'), deleteRoomValidator, deleteRoom);

module.exports = router;
