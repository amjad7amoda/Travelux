const CarRentalOffice = require('../../models/Cars/carRentalOfficeModel');
const handlerFactory = require('../handlersFactory');
const asyncHandler = require('../../middlewares/asyncHandler');
const { uploadSingleImage } = require('../../middlewares/uploadImageMiddleware');
const ApiError = require('../../utils/apiError');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra'); // fs-extra library

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
    const officeDir = `uploads/offices/${officeName}`;
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
    select: 'name email'
});

// @desc Get a single car rental office by ID
// @route GET /api/offices/:id
// @access Public
exports.getOffice = handlerFactory.GetOne(CarRentalOffice);

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
    const oldDir = `uploads/offices/${oldOffice.name}`;
    const newDir = `uploads/offices/${req.body.name}`;
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
            img.replace(`/uploads/offices/${oldOffice.name}/`, `/uploads/offices/${req.body.name}/`)
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

// exports.deleteOffice = handlerFactory.DeleteOne(CarRentalOffice); 