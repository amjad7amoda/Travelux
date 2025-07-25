const factory = require('../handlersFactory');
const TrainTripBooking = require('../../models/Trains/trainTripBookingModel');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiError = require('../../utils/apiError');
const TrainTrip = require('../../models/Trains/trainTripModel');
const Train = require('../../models/Trains/trainModel');
const { formatMinutesToHHMM } = require('../../utils/calculate');

// @desc Get train booking for a user
// @route GET /api/train-trip-bookings/
// @access Public (for user)
exports.getAllTrainTripBookings = asyncHandler( async(req, res, next) => {
    const user = req.user;
    const tripsBooking = await TrainTripBooking.find({ user: user._id })
        .populate({
            path: 'startStation endStation',
            select: 'city'
        });

    if(tripsBooking.length == 0)
        return next(new ApiError(`You don't have any train trips booking`, 400));


    return res.json({
        status: 'sucess',
        data: tripsBooking
    });
});

// @desc make new train booking for a user
// @route POST /api/train-trip-bookings/
// @access Public (for user)
exports.bookTrainTrip = asyncHandler( async(req, res, next) => {
    const user = req.user;
    const trainTrip = await TrainTrip.findById(req.body.trainTrip).populate({ path: 'stations.station', select: 'name country city code'});

    if(!trainTrip)
        return next(new ApiError('Train trip not found.', 400));

    if(trainTrip.status == 'prepared')
        return next(new ApiError('Train trip prepared you can\'t booking anymore.', 400));

    if(trainTrip.status != 'preparing')
        return next(new ApiError('Train trip is not available anymore.', 400));

    const prevBooking = await TrainTripBooking.find({ trainTrip: trainTrip._id, user: user._id});
    if(prevBooking.length != 0)
        return next(new ApiError('You alreay booked in this trip', 400));

    if(trainTrip.availableSeats == 0)
        return next(new ApiError(`There's no more ticket in this trip.`, 400));

    const { startCity, endCity, numOfSeats } = req.body;

    const startStationObject = trainTrip.stations.find(
        s => s.station.city.toLowerCase() === startCity.toLowerCase()
    );
    const endStationObject = trainTrip.stations.find(
        s => s.station.city.toLowerCase() === endCity.toLowerCase()
    );

    if(!startStationObject || !endStationObject){
        return next(new ApiError(`There's no train trip between those cities`, 400))
    }
    const estimatedTime = endStationObject.arrivalOffset - startStationObject.departureOffset;
    const departureTime = new Date(trainTrip.departureTime.getTime() + startStationObject.departureOffset * 60000);
    const arrivalTime = new Date(trainTrip.departureTime.getTime() + endStationObject.arrivalOffset * 60000);

    const platform = Math.floor(Math.random() * 12) + 1;
    const newBooking = await TrainTripBooking.create({
        user: user._id,
        trainTrip,
        numOfSeats,
        bookingDate: new Date(),
        totalPrice: trainTrip.price * numOfSeats,
        startStation: startStationObject.station,
        endStation: endStationObject.station,
        platform,
        estimatedTime,
        estimatedTimeStr: formatMinutesToHHMM(estimatedTime),
        departureTime,
        arrivalTime
    });
    trainTrip.availableSeats = trainTrip.availableSeats - numOfSeats;
    await trainTrip.save();

    await newBooking.populate([{
        path: 'user',
        select: 'firstName lastName email avatar'
    },{
        path: 'startStation endStation',
        select: 'name country city code'
    }]);

    return res.json({
        status: 'sucess',
        data: {
            Book: newBooking
        }
    })
});


// @desc Update train booking for a user
// @route PUT /api/train-trip-bookings/
// @access Public (for user)
exports.updateBooking = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const trainTripBooking = await TrainTripBooking.findById({_id: req.params.id, user: user._id});

    if (!trainTripBooking) return next(new ApiError("Booking not found", 400));
    if(trainTripBooking.user.toString() !== user._id.toString())
        return next(new ApiError("You don't have permission to update this booking", 400));

    if(trainTrip.departureTime.getTime() - Date.now() < 24 * 60 * 60000)
        return next(new ApiError(`You can't update your booking anymore.`));

    let { status, addSeats, removeSeats } = req.body;



    //Cancel booking
    if (status === 'cancelled') {
        trainTrip.availableSeats += trainTripBooking.numOfSeats;
        await trainTripBooking.deleteOne();
        trainTrip.save();
        return res.json({ status: 'success', message: 'Your booking has been cancelled.' });
    }else{
        trainTrip.status = status;
    }
   
    // Add seats
    if (addSeats) {
        const remainingSeats = trainTrip.availableSeats - addSeats;
        if (remainingSeats < 0) 
            return next(new ApiError(`Not enough available seats. Only ${trainTrip.availableSeats} left.`, 400));
        trainTripBooking.numOfSeats += addSeats;
        trainTripBooking.totalPrice += trainTrip.price * addSeats;
        trainTrip.availableSeats -= addSeats;
        await trainTripBooking.save();
    }

    // Remove seats
    if (removeSeats) {
        const newSeatCount = trainTripBooking.numOfSeats - removeSeats;
        if (newSeatCount < 0) {
            return next(new ApiError("Cannot remove more seats than currently booked.", 400));
        }

        trainTripBooking.numOfSeats = newSeatCount;
        trainTripBooking.totalPrice -= trainTrip.price * removeSeats;
        trainTrip.availableSeats += removeSeats;

        await trainTripBooking.save();
    }

    await trainTrip.save();
    res.json({ success: true, trainTripBooking });
});

exports.getBookingById = asyncHandler(async (req, res, next) => {
  const booking = await TrainTripBooking.findById(req.params.id)
    .populate({
      path: 'trainTrip',
      select: 'stations',
      populate: {
        path: 'stations.station',
        select: 'name country city code'
      }
    })
    .populate({ path: 'user', select: 'firstName lastName' })
    .populate({ path: 'startStation endStation', select: 'name country city code' });

  if (!booking) {
    return next(new ApiError('Booking not found', 404));
  }

  //Check if the user is the owner of the booking or the admin
  if (String(booking.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ status: 'fail', message: 'You dont have permission to view this booking' });
  }

  res.json({
    status: 'success',
    message: 'Booking fetched successfully',
    data: { booking }
  });
});