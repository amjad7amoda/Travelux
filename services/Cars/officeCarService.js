const Car = require('../../models/Cars/carModel');
const CarRentalOffice = require('../../models/Cars/carRentalOfficeModel');
const mongoose = require('mongoose');
const asyncHandler = require('../../middlewares/asyncHandler');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const CarBooking = require('../../models/Cars/carBookingModel');

exports.uploadCarImages = upload.array('images', 5);

exports.resizeCarImages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();
  let images = [];
  let carName = req.body.brand;
  let carModel = req.body.model;
  let existingImagesCount = 0;
  if (!carName || !carModel || req.params.carId) {
    const car = await Car.findById(req.params.carId);
    if (!car) {
      return res.status(400).json({ status: 'fail', message: 'Car not found' });
    }
    carName = car.brand;
    carModel = car.model;
    existingImagesCount = Array.isArray(car.images) ? car.images.length : 0;
  }

  const office = 'office';
  if (req.params.officeId) {
    const office = await CarRentalOffice.findById(req.params.officeId);
    if (!office) {
      return res.status(400).json({ status: 'fail', message: 'Office not found' });
    }
    officeName = office.name;
  }
  const carDir = `uploads/offices/${officeName}/${carName}-${carModel}`;
  if (!fs.existsSync(carDir)) {
    fs.mkdirSync(carDir, { recursive: true });
  }
  for (let i = 0; i < req.files.length; i++) {
    const filename = `car-image-${Date.now()}-${existingImagesCount + i + 1}.jpeg`;
    const imagePath = `${carDir}/${filename}`;
    await sharp(req.files[i].buffer)
      .resize(1200, 800)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(imagePath);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    images.push(`${baseUrl}/${imagePath.replace(/\\/g, '/')}`);
  }
  req.body.images = images;
  next();
});

// @route   GET /api/offices/:officeId/cars
// @desc    Get all cars for an office
// @access  Public
exports.getAllCars = asyncHandler(async (req, res) => {
  const { officeId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(officeId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid office ID', code: 400 });
  }
  const cars = await Car.find({ office: officeId }).populate('office');
  res.json({ status: 'success', data: { cars } });
});

// @route   GET /api/offices/:officeId/cars/:carId
// @desc    Get a car by ID for an office
// @access  Public
exports.getCarById = asyncHandler(async (req, res) => {
  const { officeId, carId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(officeId) || !mongoose.Types.ObjectId.isValid(carId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid office or car ID', code: 400 });
  }
  const car = await Car.findOne({ _id: id, office: officeId });
  if (!car) return res.status(404).json({ status: 'fail', message: 'Car not found in this office', code: 404 });
  res.json({ status: 'success', data: { car } });
});

// @route   POST /api/offices/:officeId/cars
// @desc    Create a new car for an office
// @access  Private (Office Manager/Admin)
exports.createCar = asyncHandler(async (req, res) => {
  const { officeId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(officeId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid office ID', code: 400 });
  }
  const car = new Car({ ...req.body, office: officeId, images: req.body.images });
  await car.save();
  res.status(201).json({ status: 'success', data: { car }, message: 'Car added successfully' });
});

// @route   PATCH /api/offices/:officeId/cars/:carId
// @desc    Update car images, status, and booking date
// @access  Private (Office Manager/Admin)
exports.updateCar = asyncHandler(async (req, res) => {
  const { officeId, carId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(officeId) || !mongoose.Types.ObjectId.isValid(carId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid office or car ID' });
  }
  const car = await Car.findOne({ _id: carId, office: officeId });
  if (!car) {
    return res.status(400).json({ status: 'fail', message: 'Car not found in this office' });
  }
  // Only allow updating images (add new) and status
  if (req.body.images && Array.isArray(req.body.images)) {
    car.images = car.images.concat(req.body.images);
  }
  if (req.body.status) {
    car.status = req.body.status;
    if (req.body.status === 'booked' && req.body.booked_until) {
      car.booked_until = req.body.booked_until;
    }
  }
  await car.save();
  res.json({ status: 'success', message: 'Car updated successfully', data: { car } });
});


// @route   GET /api/offices/:officeId/cars/bookings
// @desc    Get all bookings for cars in a specific office
// @access  Private (Office Manager/Admin)
exports.getOfficeBookings = asyncHandler(async (req, res) => {
  const { officeId } = req.params;
  const office = await require('../../models/Cars/carRentalOfficeModel').findById(officeId);
  if (!office) {
    return res.status(404).json({ status: 'fail', message: 'Office not found' });
  }
  //Check if user is authorized to view bookings for this office
  if (String(office.officeManager) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ status: 'fail', message: 'You are not authorized to view bookings for this office' });
  }
  //Get all cars in the office
  const cars = await require('../../models/Cars/carModel').find({ office: officeId }, '_id');
  const carIds = cars.map(car => car._id);
  //Get all bookings for the cars in the office
  const bookings = await CarBooking.find({ car: { $in: carIds } }).populate('car');
  res.json({ status: 'success', message: 'Office bookings fetched successfully', data: { bookings } });
});