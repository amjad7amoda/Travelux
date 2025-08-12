const factory = require('../handlersFactory');
const HotelBooking = require('../../models/Hotels/hotelBookingModel');
const Room = require('../../models/Hotels/roomModel');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiFeatures = require('../../utils/apiFeatures');
const Hotel = require('../../models/Hotels/hotelModel');
const Bill = require('../../models/Payments/billModel');
const { createNotification } = require('../notificationService');


// @desc Create a hotel booking
// @route POST /api/v1/hotelBookings
// @access Private/User
exports.createHotelBooking = factory.CreateOne(HotelBooking);

// @desc Get all hotel bookings for all users
// @route GET /api/v1/hotelBookings
// @access Private/Admin
exports.getAllHotelBookings = asyncHandler(async (req, res, next) => {
    let filterObj = {};
    if (req.filteration) {
        filterObj = req.filteration;
    }

    const countDocs = await HotelBooking.countDocuments();

    const apiFeatures = new ApiFeatures(
        HotelBooking.find(filterObj),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate(countDocs)
        .buildQuery();

    const { paginateResult, mongooseQuery } = apiFeatures;
    let bookings = await mongooseQuery
        .populate('user', 'firstName lastName email avatar')
        .populate('hotel', 'name')
        .populate('room', 'roomNumber roomType');

    // Custom search for hotel name, room, and user if keyWord is provided
    if (req.query.keyWord) {
        const keyword = req.query.keyWord.replace(/^keyWord:/, '').trim().toLowerCase();
        bookings = bookings.filter(booking => {
            const hotelMatch = booking.hotel && booking.hotel.name && booking.hotel.name.toLowerCase().includes(keyword);
            const roomNumberMatch = booking.room && booking.room.roomNumber && booking.room.roomNumber.toString().toLowerCase().includes(keyword);
            const roomTypeMatch = booking.room && booking.room.roomType && booking.room.roomType.toLowerCase().includes(keyword);
            const userFirstNameMatch = booking.user && booking.user.firstName && booking.user.firstName.toLowerCase().includes(keyword);
            const userLastNameMatch = booking.user && booking.user.lastName && booking.user.lastName.toLowerCase().includes(keyword);
            return hotelMatch || roomNumberMatch || roomTypeMatch || userFirstNameMatch || userLastNameMatch;
        });
        // Update pagination result if filtered
        if (bookings.length < paginateResult.limit) {
            paginateResult.currentPage = 1;
            paginateResult.numOfPages = 1;
            paginateResult.hasPreviousPage = false;
            paginateResult.hasNextPage = false;
            delete paginateResult.next;
            delete paginateResult.prev;
        }
    }

    if (!bookings || bookings.length === 0)
        return next(new ApiError(`there is no bookings yet`, 404));

    res.status(200).json({
        status: "SUCCESS",
        result: paginateResult,
        data: { bookings: bookings }
    });
});

// @desc Get all hotel bookings for a current manager
// @route GET /api/v1/hotelBookings/manager
// @access Private/HotelManager
exports.getAllHotelBookingsForCurrentManager = asyncHandler(async (req, res, next) => {
    let filterObj = {};
    if (req.filteration) {
        filterObj = req.filteration;
    }

    // Get all hotels owned by the current manager
    const managerHotels = await Hotel.find({ hotelManager: req.user._id }).select('_id');
    const managerHotelIds = managerHotels.map(hotel => hotel._id);

    // Add filter to only get bookings for hotels owned by the manager
    filterObj.hotel = { $in: managerHotelIds };

    const countDocs = await HotelBooking.countDocuments(filterObj);

    const apiFeatures = new ApiFeatures(
        HotelBooking.find(filterObj),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate(countDocs)
        .buildQuery();

    const { paginateResult, mongooseQuery } = apiFeatures;
    let bookings = await mongooseQuery
        .populate('user', 'firstName lastName email avatar')
        .populate('hotel', 'name')
        .populate('room', 'roomNumber roomType');

    // Custom search for hotel name, room, and user if keyWord is provided
    if (req.query.keyWord) {
        const keyword = req.query.keyWord.replace(/^keyWord:/, '').trim().toLowerCase();
        bookings = bookings.filter(booking => {
            const hotelMatch = booking.hotel && booking.hotel.name && booking.hotel.name.toLowerCase().includes(keyword);
            const roomNumberMatch = booking.room && booking.room.roomNumber && booking.room.roomNumber.toString().toLowerCase().includes(keyword);
            const roomTypeMatch = booking.room && booking.room.roomType && booking.room.roomType.toLowerCase().includes(keyword);
            const userFirstNameMatch = booking.user && booking.user.firstName && booking.user.firstName.toLowerCase().includes(keyword);
            const userLastNameMatch = booking.user && booking.user.lastName && booking.user.lastName.toLowerCase().includes(keyword);
            return hotelMatch || roomNumberMatch || roomTypeMatch || userFirstNameMatch || userLastNameMatch;
        });
        // Update pagination result if filtered
        if (bookings.length < paginateResult.limit) {
            paginateResult.currentPage = 1;
            paginateResult.numOfPages = 1;
            paginateResult.hasPreviousPage = false;
            paginateResult.hasNextPage = false;
            delete paginateResult.next;
            delete paginateResult.prev;
        }
    }

    if (!bookings || bookings.length === 0)
        return res.status(200).json({ status: 'SUCCESS', data: [] });

    res.status(200).json({
        status: "SUCCESS",
        result: paginateResult,
        data: { bookings: bookings }
    });
});

// @desc Get all hotel bookings for a current user
// @route GET /api/v1/hotelBookings/user
// @access Private/User
exports.getAllHotelBookingsForCurrentUser = asyncHandler(async (req, res, next) => {
    const hotelBookings = await HotelBooking.find({
        user: req.user._id,
        status: 'active'
    }).populate('user', 'firstName lastName email avatar').populate('hotel', 'name city country coverImage').populate('room', 'roomNumber roomType');
    res.status(200).json({
        status: 'SUCCESS',
        data: hotelBookings
    });
});

// @desc Get a hotel booking
// @route GET /api/v1/hotelBookings/:id
// @access Private/User
exports.getHotelBooking = factory.GetOne(HotelBooking, [
    { path: 'user', select: 'firstName lastName email avatar' },
    { path: 'hotel', select: 'name city country coverImage' },
    { path: 'room', select: 'roomNumber roomType' }
]);

// @desc Update a hotel booking
// @route PUT /api/v1/hotelBookings/:id
// @access Private/User
exports.updateHotelBooking = factory.UpdateOne(HotelBooking);

// @desc Delete a hotel booking
// @route DELETE /api/v1/hotelBookings/:id
// @access Private/User
exports.deleteHotelBooking = factory.DeleteOne(HotelBooking);

exports.setUserIdToBody = (req, res, next) => {
    if (req.user) req.body.user = req.user._id;
    next();
}

exports.setTotalBookingPrice = async (req, res, next) => {
    const { room, checkInDate, checkOutDate } = req.body;

    // Validate required fields
    if (!room || !checkInDate || !checkOutDate) {
        return next(new ApiError('Missing required fields [room, checkInDate, checkOutDate]', 400));
    }

    // Get room details
    const roomDetails = await Room.findById(room);
    if (!roomDetails) {
        return next(new ApiError('Room not found', 404));
    }

    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) {
        return next(new ApiError('Invalid date range', 400));
    }

    const totalPrice = roomDetails.pricePerNight * totalDays;
    req.body.totalPrice = totalPrice;
    req.body.hotel = roomDetails.hotel;

    next();
}

exports.setUserIdToBody = (req, res, next) => {
    if (req.user) req.body.user = req.user._id;
    next();
}

exports.markBookingAsConfirmed = async (req, res, next) => {
    req.body.status = 'confirmed';
    next();
}

exports.markBookingAsCancelled = async (req, res, next) => {
    req.body.status = 'cancelled';
    next();
}

exports.markBookingAsPending = async (req, res, next) => {
    req.body.status = 'pending';
    next();
}

exports.markRoomAsNotAvailable = async (req, res, next) => {
    const room = await Room.findById(req.body.room);
    room.isAvailable = false;
    await room.save();
    next();
}

exports.markRoomAsAvailable = asyncHandler(async (req, res, next) => {
    const bookingId = req.params.id;
    const booking = await HotelBooking.findById(bookingId);
    const room = await Room.findById(booking.room);
    room.isAvailable = true;
    await room.save();
    next();
});

exports.setRoomIdToBody = asyncHandler(async (req, res, next) => {
    const bookingId = req.params.id;
    const booking = await HotelBooking.findById(bookingId);
    req.body.room = booking.room;
    next();
});

exports.setHotelIdToBody = asyncHandler(async (req, res, next) => {
    const bookingId = req.params.id;
    const booking = await HotelBooking.findById(bookingId);
    req.body.hotel = booking.hotel;
    next();
});

exports.checkOwnership = asyncHandler(async (req, res, next) => {
    const bookingId = req.params.id;
    const booking = await HotelBooking.findById(bookingId);
    if (!booking) {
        return next(new ApiError('Booking not found', 404));
    }
    if (booking.user.toString() !== req.user._id.toString()) {
        return next(new ApiError('You are not allowed to update this booking', 403));
    }
    next();
});

exports.handleRoomChange = asyncHandler(async (req, res, next) => {
    const bookingId = req.params.id;
    const booking = await HotelBooking.findById(bookingId);
    const roomId = booking.room;
    const newRoomId = req.body.room;
    if (roomId.toString() !== newRoomId.toString()) {
        const newRoom = await Room.findById(newRoomId);
        if (!newRoom) {
            return next(new ApiError('Room not found', 404));
        }
        if (!newRoom.isAvailable) {
            return next(new ApiError('Room is not available', 400));
        }
        const oldRoom = await Room.findById(roomId);
        oldRoom.isAvailable = true;
        await oldRoom.save();
        newRoom.isAvailable = false;
        await newRoom.save();
    }
    next();
});

exports.handleNoRoomChange = asyncHandler(async (req, res, next) => {
    if (!req.body.room) {
        return exports.setRoomIdToBody(req, res, next);
    }
    next();
});

exports.changeBillValues = (async (req, res, next) => {
    const bookingId = req.params.id;
    const booking = await HotelBooking.findById(bookingId);
    const oldTotalPrice = booking.totalPrice;
    const room = await Room.findById(booking.room);
    const hotel = await Hotel.findById(booking.hotel);

    const bill = await Bill.findOne({ user: booking.user, status: 'continous' });
    if (bill) {
        const bookingItem = bill.items.find(item => item.bookingId.toString() === bookingId.toString());
        if (bookingItem) {
            console.log("req.body.totalPrice", req.body.totalPrice);
            console.log("bookingItem.price", bookingItem.price);
            console.log("bill.totalPrice", bill.totalPrice);
            bill.totalPrice = bill.totalPrice - oldTotalPrice + req.body.totalPrice; // update the bill total price
            await bill.save();
        }
    }
    console.log("Bill values changed successfully", bill);
    next();
});

exports.changeBillValuesForCanceledBooking = (async (req, res, next) => {
    console.log("changeBillValuesForCanceledBooking");
    const bookingId = req.params.id;
    const booking = await HotelBooking.findById(bookingId);
    if (!booking) { 
        throw new ApiError("Booking not found", 400);
    }
    const oldTotalPrice = booking.totalPrice;
    const bill = await Bill.findOne({ user: booking.user, status: 'continous' });
    if (bill) {
        console.log("Bill found", bill);
        const bookingItem = bill.items.find(item => item.bookingId.toString() === bookingId.toString());
        if (bookingItem) {
            bill.totalPrice -= oldTotalPrice; // update the bill total price
            await bill.save();
        }
    }
    console.log("Bill values changed successfully", bill);
    next();
});

exports.createBookingNotification = asyncHandler(async (req, res, next) => {
    const bookingId = req.params.id;
    const booking = await HotelBooking.findById(bookingId);
    const user = booking.user;
    const notification = await createNotification(user._id, 'Hotel Booking', `You have booked a room in ${booking.hotel.name}`, 'hotel');
});

exports.updateBookingNotification = asyncHandler(async (req, res, next) => {
    const bookingId = req.params.id;
    const booking = await HotelBooking.findById(bookingId);
    const user = booking.user;
    const notification = await createNotification(user._id, 'Hotel Booking', `You have updated your booking in ${booking.hotel.name}`, 'hotel');
    next();
});

exports.deleteBookingNotification = asyncHandler(async (req, res, next) => {
    const bookingId = req.params.id;
    const booking = await HotelBooking.findById(bookingId);
    const user = booking.user;
    const notification = await createNotification(user._id, 'Hotel Booking', `You have canceled your booking in ${booking.hotel.name}`, 'hotel');
    next();
});