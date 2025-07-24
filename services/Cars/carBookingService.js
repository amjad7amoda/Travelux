const CarBooking = require('../../models/Cars/carBookingModel');
const Car = require('../../models/Cars/carModel');
const asyncHandler = require('../../middlewares/asyncHandler');
const factory = require('../handlersFactory');
const mongoose = require('mongoose');

// @route   POST /api/cars/bookings
// @desc    Create a new car booking
// @access  Public
exports.createBooking = asyncHandler(async (req, res) => {
  //Check if car exists
  const car = await Car.findById(req.body.car);
  if (!car) {
    return res.status(400).json({ status: 'fail', message: 'Car not found' });
  }

  if(car.status === 'maintenance')
    return res.status(400).json({ status: 'fail', message: 'Car is under maintenance' });
  
  //Check if there is a conflict with another booking for the same car
  const conflict = await CarBooking.findOne({
    car: req.body.car,
    status: { $ne: 'cancelled' },
    $or: [
      { startDate: { $lt: req.body.endDate }, endDate: { $gt: req.body.startDate } }
    ]
  });
  if (conflict) {
    return res.status(400).json({ status: 'fail', message: 'There is a conflicting booking for this car in the selected period.' });
  }

  //Calculate total price
  const start = new Date(req.body.startDate);
  const end = new Date(req.body.endDate);
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const totalPrice = car.pricePerDay * diffDays;
  req.body.totalPrice = totalPrice;
  req.body.user = req.user._id;

  //Update car status and booked_until
  car.status = 'booked';
  car.booked_until = req.body.endDate;
  await car.save();
  
  //Create booking
  const booking = new CarBooking(req.body);
  await booking.save();

  // Populate car and user before sending response
  await booking.populate(['car']);
  res.status(201).json({ status: 'success', message: 'Booking created successfully', data: { booking } });
});

// @route   PATCH /api/cars/bookings/:id
// @desc    Update a car booking (dates, status, paymentStatus, notes)
// @access  Private (User)
exports.updateBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const booking = await CarBooking.findById(id);
    if (!booking) {
        return res.status(404).json({ status: 'fail', message: 'Booking not found' });
    }

    //Check if car or user is changed
    if (req.body.car && req.body.car !== String(booking.car))
        return res.status(400).json({ status: 'fail', message: 'Cannot change the booked car' });
    if (req.body.user && req.body.user !== String(booking.user)) 
        return res.status(400).json({ status: 'fail', message: 'Cannot change the booking user' });

    //Update dates
    let startDate = booking.startDate;
    let endDate = booking.endDate;
    if (req.body.startDate) startDate = new Date(req.body.startDate);
    if (req.body.endDate) endDate = new Date(req.body.endDate);

    //Check if there is a conflict with another booking for the same car
    const conflict = await CarBooking.findOne({
        car: booking.car,
        _id: { $ne: booking._id },
        $or: [
        { startDate: { $lt: endDate }, endDate: { $gt: startDate } }
        ]
    });
    if (conflict)
        return res.status(400).json({ status: 'fail', message: 'Booking dates conflict with another booking for this car' });
    
    //Update car status and booked_until
    if (req.body.startDate || req.body.endDate) {
        const car = await Car.findById(booking.car);
        car.booked_until = booking.endDate;
        await car.save();
    }

    //Update allowed fields
    booking.startDate = startDate;
    booking.endDate = endDate;

    if (req.body.status) booking.status = req.body.status;
    if (req.body.paymentStatus) booking.paymentStatus = req.body.paymentStatus;
    if (req.body.notes) booking.notes = req.body.notes;

    //Recalculate total price
    const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const car = await Car.findById(booking.car);
    booking.totalPrice = car.pricePerDay * diffDays;

    await booking.save();
    await booking.populate(['car']);
    res.json({ status: 'success', message: 'Booking updated successfully', data: { booking } });
});

// @route   PATCH /api/cars/bookings/:id/cancel
// @desc    Cancel a car booking
// @access  Private (User)
exports.cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await CarBooking.findById(id);
  if (!booking) {
    return res.status(404).json({ status: 'fail', message: 'Booking not found' });
  }

  //Check if user is authorized to cancel the booking
  if (String(booking.user) !== String(req.user._id) && req.user.role !== 'admin') 
    return res.status(403).json({ status: 'fail', message: 'You are not authorized to cancel this booking' });
  

  if (booking.status === 'cancelled') 
    return res.status(400).json({ status: 'fail', message: 'Booking is already cancelled' });
  
  booking.status = 'cancelled';
  await booking.save();

  //Update car status if this is the last active booking for the car
  const car = await Car.findById(booking.car);
  if (car && car.booked_until && +car.booked_until === +booking.endDate) {
    car.status = 'available';
    car.booked_until = null;
    await car.save();
  }

  await booking.populate(['car']);
  res.json({ status: 'success', message: 'Booking cancelled successfully', data: { booking } });
});


// @route   GET /api/cars/bookings/:id
// @desc    Get a car booking by ID
// @access  Public
exports.getBookingById = factory.GetOne(CarBooking, {
  path: 'car',
  select: 'brand model images',
  populate:{
    path: 'office',
    select: 'name city counntry phone'
  }
});

// @route   GET /api/cars/bookings
// @desc    Get all car bookings
// @access  Private (Admin)
exports.getAllBookings = factory.GetAll(CarBooking, 'car');

// @route   GET /api/cars/bookings/my-bookings
// @desc    Get all my car bookings
// @access  Private (User)
exports.getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await CarBooking.find({ user: req.user._id }).populate({
    path: 'car',
    select: 'brand model images',
    populate:{
      path: 'office',
      select: 'name city counntry phone'
    }
  });

  if(bookings.length === 0)
    return res.status(404).json({ status: 'fail', message: 'No bookings found' });
  
  res.json({ status: 'success', message: 'My bookings fetched successfully', data: { bookings } });
});

