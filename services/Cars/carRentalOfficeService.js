const CarRentalOffice = require('../../models/Cars/carRentalOfficeModel');
const handlerFactory = require('../handlersFactory');
const asyncHandler = require('../../middlewares/asyncHandler');
const { uploadSingleImage } = require('../../middlewares/uploadImageMiddleware');
const ApiError = require('../../utils/apiError');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra'); // fs-extra library
const Car = require('../../models/Cars/carModel');
const CarBooking = require('../../models/Cars/carBookingModel');

// @desc Upload a cover image for a car rental office
// @route POST /api/offices
// @access Private (officeManager, admin)
exports.uploadOfficeCoverImage = uploadSingleImage('coverImage');

// @desc Resize and save the cover image for a car rental office
// @route POST/PUT /api/offices
// @access Private (officeManager, admin)
exports.resizeOfficeCoverImage = asyncHandler(async (req, res, next) => {
  // Determine the correct office name (new if in req.body, else from DB)
  let officeName = req.body && req.body.name;
  if ((!officeName || officeName === '') && req.params.id) {
    const office = await CarRentalOffice.findById(req.params.id);
    if (office) {
      officeName = office.name;
    }
  }
  if (req.file && officeName) {
    const officeDir = `uploads/offices/${officeName.replace(/\s+/g, '_')}`;
    if (!fs.existsSync(officeDir)) {
      fs.mkdirSync(officeDir, { recursive: true });
    }
    const imagePath = `${officeDir}/cover.jpeg`;
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    await sharp(req.file.buffer)
      .resize(1200, 800)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(imagePath);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    req.body.coverImage = `${baseUrl}/${imagePath.replace(/\\/g, '/')}`;
  }
  next();
});

// @desc Create a new car rental office
// @route POST /api/offices
// @access Private (officeManager, admin)
exports.createOffice = asyncHandler(async (req, res, next) => {
  req.body.officeManager = req.user._id;
  return handlerFactory.CreateOne(CarRentalOffice)(req, res, next);
});

// @desc Get all car rental offices
// @route GET /api/offices
// @access Public
exports.getAllOffices = handlerFactory.GetAll(CarRentalOffice, 'carRentalOffice', {
    path: 'officeManager',
    select: 'firstName lastName email'
});

// @desc Get a single car rental office by ID
// @route GET /api/offices/:id
// @access Public
exports.getMyOffice = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const office = await CarRentalOffice.findOne({ officeManager: user._id }).populate({
    path: 'officeManager',
    select: 'firstName lastName email role'
  });

  if(!office) 
    return res.status(200).json({ status: 'SUCCESS', data: { office: [] } });
  
  const carsCount = await Car.countDocuments({ office: office._id });

  res.status(200).json({ status: 'SUCCESS', data: { 
    office:{
      cars: carsCount,
      ...office._doc
    }
  } });
})

exports.getOffice = handlerFactory.GetOne(CarRentalOffice, {
  path: 'officeManager',
  select: 'firstName lastName email role'
});

// @desc Update a car rental office
// @route PUT /api/offices/:id
// @access Private (officeManager, admin)
exports.updateOffice = asyncHandler(async (req, res, next) => {
  const officeId = req.params.id;
  const oldOffice = await CarRentalOffice.findById(officeId);
  if (!oldOffice) {
    return next(new ApiError('Office not found', 400));
  }

  // Only handle folder rename if name is changed
  if (req.body && req.body.name && req.body.name !== oldOffice.name) {
    const oldDir = `uploads/offices/${oldOffice.name.replace(/\s+/g, '_')}`;
    const newDir = `uploads/offices/${req.body.name.replace(/\s+/g, '_')}`;
    if (fs.existsSync(oldDir)) {
      if (fs.existsSync(newDir)) {
        return next(new ApiError('The new office name is already in use or a folder with the same name exists!', 400));
      }
      fse.copySync(oldDir, newDir);
      fse.removeSync(oldDir);

      // Update coverImage path in DB if cover.jpeg exists
      const coverPath = `${newDir}/cover.jpeg`;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      if (fs.existsSync(coverPath)) {
        await CarRentalOffice.findByIdAndUpdate(officeId, {
          coverImage: `${baseUrl}/${coverPath.replace(/\\/g, '/')}`
        });
      }

      // Update all car images paths for this office
      const Car = require('../../models/Cars/carModel');
      const cars = await Car.find({ office: officeId });
      for (const car of cars) {
        if (Array.isArray(car.images)) {
          const newImages = car.images.map(img =>
            img.replace(
              `/uploads/offices/${oldOffice.name.replace(/\s+/g, '_')}/`,
              `/uploads/offices/${req.body.name.replace(/\s+/g, '_')}/`
            )          
          );
          await Car.findByIdAndUpdate(car._id, { images: newImages });
        }
      }
    } else {
      return next(new ApiError('Old directory does not exist', 400));
    }
  }

  const updatedOffice = await CarRentalOffice.findByIdAndUpdate(officeId, req.body, { new: true, runValidators: true });
  if (!updatedOffice) {
    return next(new ApiError('Office not found after update', 400));
  }
  res.status(200).json({ status: 'SUCCESS', data: { carRentalOffice: updatedOffice } });
});


// @route   GET /api/offices/statistics/top-rented-cars-by-days
// @desc    Get top 5 most rented cars in an office
// @access  Private (Office Manager/Admin)
exports.getTopRentedCarsByDays = asyncHandler(async (req, res) => {
  const user = req.user;

  // Validate office
  const office = await CarRentalOffice.findOne({ officeManager: user._id });
  if (!office) {
    return res.status(400).json({ status: 'fail', message: `You don't have an office`});
  }

  // Get all car IDs in the office
  const cars = await Car.find({ office: office._id });
  const carIds = cars.map(car => car._id);
  let limit = parseInt(req.query.limit) || 5;
  // Aggregate bookings to get top cars by total rented days
  const topCars = await CarBooking.aggregate([
    { $match: { car: { $in: carIds } } },
    { $addFields: {
        daysRented: {
          $ceil: { $divide: [ { $subtract: ["$endDate", "$startDate"] }, 1000 * 60 * 60 * 24 ] }
        }
      }
    },
    { $group: { _id: '$car', totalDaysRented: { $sum: '$daysRented' } } },
    { $sort: { totalDaysRented: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'cars',
        localField: '_id',
        foreignField: '_id',
        as: 'carInfo'
      }
    },
    { $unwind: '$carInfo' },
    {
      $project: {
        _id: 0,
        daysRented: '$totalDaysRented',
        carId: '$_id',
        brand: '$carInfo.brand',
        model: '$carInfo.model',
        year: '$carInfo.year',
        pricePerDay: '$carInfo.pricePerDay'
      }
    }
  ]);
  res.json({ status: 'success', data: { topCarsByDays: topCars } });
});

// @route   GET /api/offices/statistics/top-rented-cars-by-bookings
// @desc    Get top cars by number of bookings in an office
// @access  Private (Office Manager/Admin)
exports.getTopRentedCarsByBookings = asyncHandler(async (req, res) => {
  const user = req.user;

  // Validate office
  const office = await CarRentalOffice.findOne({ officeManager: user._id });
  if (!office) {
    return res.status(400).json({ status: 'fail', message: `You don't have an office`});
  }

  // Get all car IDs in the office
  const cars = await Car.find({ office: office._id });
  const carIds = cars.map(car => car._id);
  let limit = parseInt(req.query.limit) || 5;
  
  // Aggregate bookings to get top cars by number of bookings
  const topCars = await CarBooking.aggregate([
    { $match: { car: { $in: carIds } } },
    { $group: { _id: '$car', bookingsCount: { $sum: 1 } } },
    { $sort: { bookingsCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'cars',
        localField: '_id',
        foreignField: '_id',
        as: 'carInfo'
      }
    },
    { $unwind: '$carInfo' },
    {
      $project: {
        _id: 0,
        bookingsCount: '$bookingsCount',
        carId: '$_id',
        brand: '$carInfo.brand',
        model: '$carInfo.model',
        year: '$carInfo.year',
        pricePerDay: '$carInfo.pricePerDay'
      }
    }
  ]);
  res.json({ status: 'success', data: { topCarsByBookings: topCars } });
});

// @route   GET /api/offices/statistics/counters
// @desc    Get statistics for the car rental office (counts, revenue, trends)
// @access  Private (Office Manager)
exports.getOfficeCounters = asyncHandler(async (req, res) => {
  const user = req.user;
  // Get the office managed by the user
  const office = await CarRentalOffice.findOne({ officeManager: user._id });
  if (!office) {
    return res.status(400).json({ status: 'fail', message: `You don't have an office` });
  }
  // Get all car IDs in the office
  const cars = await Car.find({ office: office._id });
  const carIds = cars.map(car => car._id);

  // Count cars
  const carsCount = cars.length;

  // Dates for current and previous month
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // Bookings counts
  const currentBookings = await CarBooking.countDocuments({ car: { $in: carIds }, status: { $in: ['pending', 'confirmed'] } });
  const completedCurrent = await CarBooking.countDocuments({ car: { $in: carIds }, status: 'completed', endDate: { $gte: startOfCurrentMonth, $lte: now } });
  const completedPrevious = await CarBooking.countDocuments({ car: { $in: carIds }, status: 'completed', endDate: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } });
  const cancelledCurrent = await CarBooking.countDocuments({ car: { $in: carIds }, status: 'cancelled', createdAt: { $gte: startOfCurrentMonth, $lte: now } });
  const cancelledPrevious = await CarBooking.countDocuments({ car: { $in: carIds }, status: 'cancelled', createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } });

  // Revenue
  const revenueCurrentAgg = await CarBooking.aggregate([
    { $match: { car: { $in: carIds }, paymentStatus: 'paid', status: { $in: ['confirmed', 'completed'] }, createdAt: { $gte: startOfCurrentMonth, $lte: now } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);
  const revenuePreviousAgg = await CarBooking.aggregate([
    { $match: { car: { $in: carIds }, paymentStatus: 'paid', status: { $in: ['confirmed', 'completed'] }, createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);
  const revenueCurrent = revenueCurrentAgg.length > 0 ? revenueCurrentAgg[0].total : 0;
  const revenuePrevious = revenuePreviousAgg.length > 0 ? revenuePreviousAgg[0].total : 0;

  // Change and trend calculations
  // Completed bookings
  let completedChange = 0;
  if (completedPrevious > 0) {
    completedChange = ((completedCurrent - completedPrevious) / completedPrevious) * 100;
  } else if (completedCurrent > 0) {
    completedChange = 100;
  }
  completedChange = Math.round(completedChange * 100) / 100;
  let completedTrend = 'neutral';
  if (completedChange > 0) completedTrend = 'up';
  else if (completedChange < 0) completedTrend = 'down';

  // Cancelled bookings
  let cancelledChange = 0;
  if (cancelledPrevious > 0) {
    cancelledChange = ((cancelledCurrent - cancelledPrevious) / cancelledPrevious) * 100;
  } else if (cancelledCurrent > 0) {
    cancelledChange = 100;
  }
  cancelledChange = Math.round(cancelledChange * 100) / 100;
  let cancelledTrend = 'neutral';
  if (cancelledChange > 0) cancelledTrend = 'up';
  else if (cancelledChange < 0) cancelledTrend = 'down';

  // Revenue
  let revenueChange = 0;
  if (revenuePrevious > 0) {
    revenueChange = ((revenueCurrent - revenuePrevious) / revenuePrevious) * 100;
  } else if (revenueCurrent > 0) {
    revenueChange = 100;
  }
  revenueChange = Math.round(revenueChange * 100) / 100;
  let revenueTrend = 'neutral';
  if (revenueChange > 0) revenueTrend = 'up';
  else if (revenueChange < 0) revenueTrend = 'down';

  return res.json({
    status: 'success',
    data: {
      carsCount,
      currentBookings,
      completedBookings: {
        current: completedCurrent,
        previous: completedPrevious,
        change: completedChange,
        trend: completedTrend
      },
      cancelledBookings: {
        current: cancelledCurrent,
        previous: cancelledPrevious,
        change: cancelledChange,
        trend: cancelledTrend
      },
      totalRevenue: {
        current: revenueCurrent,
        previous: revenuePrevious,
        change: revenueChange,
        trend: revenueTrend
      }
    }
  });
});