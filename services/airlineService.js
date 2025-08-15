const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const Airline = require('../models/airlineModel');
const asyncHandler = require('../middlewares/asyncHandler');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');
const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');

// 1-)airline logo upload
exports.uploadAirlineImages = uploadSingleImage('logo');

//2-)image proccecing before save the image 
exports.resizeAirlineImages = asyncHandler(async (req, res, next) => {

    if (req.file) {
        const imageFileName = `airline-${uuidv4()}-${Date.now()}-logo.jpeg`;
        await sharp(req.file.buffer)
            .resize(2000, 2000)
            .toFormat('jpeg')
            .jpeg({ quality: 100 })
            .toFile(`uploads/airlines/${imageFileName}`);

        req.body.logo = imageFileName;
    }

    next();
});


// 3-)Helper function to delete old logo
const deleteOldLogo = async (logoFileName) => {
    const newLogoFileName = logoFileName.split('/');
    const finalNewLogoFileName = newLogoFileName[newLogoFileName.length - 1];
    
    if (logoFileName) {
        const logoPath = path.join(__dirname, '..', 'uploads', 'airlines', finalNewLogoFileName);
        try {
            await fs.unlink(logoPath);
        } catch (error) {
            console.error('Error deleting old logo:', error);
        }
    }
};


//4-) set user id to body if he is airline owner who want to create airline
exports.setAirlineOwner = asyncHandler(async (req, res, next) => {    
    if (req.user.role === 'airlineOwner' ) {
        if(req.body.owner){
            return next(new ApiError('You are not allowed to set owner',400));
        }
        req.body.owner = req.user._id;
    }
    next();
});


//5-) handlers

// @desc get list of airlines
// @route get /api/airlines
// @access public [user ,admin , airline owner]
exports.getAirlines = factory.GetAll(Airline,'Airline');

// @desc get specific airline
// @route get /api/airlines/:id
// @access public [user, admin , airline owner]
exports.getAirline = factory.GetOne(Airline);

// @desc create airline
// @route post /api/airlines
// @access private [admin , airline owner]
exports.createAirline = factory.CreateOne(Airline);



// @desc update specific airline by the admin and admin can change the owner of the airline
// @route put /api/airlines/:id
// @access private [admin]
exports.updateAirline = asyncHandler(async (req, res, next) => {
    
    const airline = await Airline.findById(req.params.id);
    if (!airline) {
        return next(new ApiError('No airline found with this id', 404));
    }

    // Delete old logo if exists and new logo is being uploaded
    if (req.file && airline.logo) {
        await deleteOldLogo(airline.logo);
    }

    const updatedAirline = await Airline.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true ,runValidators: true}
    );

    res.status(200).json({
        status: "SUCCESS",
        data: updatedAirline
    });
});

// @desc get logged in airline owner airline
// @route get /api/airlines/myAirline
// @access private [airline owner]
exports.getOwnerAirline = asyncHandler(async (req, res, next) => {
    const airline = await Airline.findOne({owner: req.user._id}).populate('planesNum');
    if (!airline) {
        return next(new ApiError('You are not owner of any airline', 404));
    }
    res.status(200).json({status:"SUCCESS",data: airline});
});


//@ update owner airline by the airline owner except the owner
// @route put /api/airlines/myAirline
// @access private [airline owner]
exports.updateOwnerAirline = asyncHandler(async (req, res, next) => {
    const airline = await Airline.findOne({owner: req.user._id});
    if (!airline) {
        return next(new ApiError('You are not owner of any airline', 404));
    }

    // Delete old logo if exists and new logo is being uploaded
    if (req.file) {
        await deleteOldLogo(airline.logo);
    }

        const updatedAirline = await Airline.findByIdAndUpdate(
            airline._id,
            req.body,
            { new: true ,runValidators: true}
        );

    res.status(200).json({
        status: "SUCCESS",
        data: updatedAirline
    });
});


//@desc get statistics
//@route get /api/airlines/myAirline/statistics
//@access private [airline owner]
exports.getStatistics = asyncHandler(async (req, res, next) => {



});


