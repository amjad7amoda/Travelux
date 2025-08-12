const express = require('express');
const authService = require('../../services/authServices');
const roomRouter = require('./roomRoute');

const router = express.Router();

router.use('/:hotelId/rooms', roomRouter);

const { createHotel,
    getAllHotels,
    getHotel,
    getCurrentManagerHotels,
    updateHotel,
    deleteHotel,
    setHotelManager,
    uploadHotelImages,
    resizeHotelImages,
    deleteHotelImage
} = require('../../services/Hotels/hotelService');

const { createHotelValidator,
    updateHotelValidator,
    getHotelValidator,
    deleteHotelValidator,
    deleteHotelImageValidator
} = require('../../utils/validators/Hotels/hotelValidator');

router
    .route('/')
    .post(authService.protect,
        authService.allowTo('hotelManager'),
        uploadHotelImages,
        resizeHotelImages,
        setHotelManager,
        createHotelValidator,
        createHotel)
    .get(getAllHotels);

router
    .route('/manager')
    .get(authService.protect,
        authService.allowTo('hotelManager'),
        getCurrentManagerHotels);


router
    .route('/:id')
    .get(getHotelValidator,
        getHotel)
    .put(authService.protect,
        authService.allowTo('hotelManager'),
        uploadHotelImages,
        resizeHotelImages,
        updateHotelValidator,
        updateHotel)
    .delete(authService.protect,
        authService.allowTo('hotelManager'),
        deleteHotelValidator,
        deleteHotel);

// Add route for deleting specific image
router.delete('/:id/images/:imageName',
    authService.protect,
    authService.allowTo('hotelManager'),
    deleteHotelImageValidator,
    deleteHotelImage
);

module.exports = router;





