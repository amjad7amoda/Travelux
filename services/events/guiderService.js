const Guider = require('../../models/trips/guiderModel');
const Trip = require('../../models/trips/tripModel');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiError = require('../../utils/apiError');
const User = require('../../models/userModel');

exports.createGuider = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.body.user);
    if (!user) {
        return next(new ApiError('User not found', 400));
    }
    // if (user.role !== 'user' || user.role !== 'guider') {
    //     return next(new ApiError('This user does not have sufficient permissions', 400));
    // }
    user.role = 'guider';
    await user.save();
    const guider = await Guider.create(req.body);
    res.status(201).json({ data: guider });
});

// @desc get guider
// @route GET /api/v1/guiders/:id
// @access public
exports.getGuider = asyncHandler(async (req, res, next) => {
    const guider = await Guider.findById(req.params.id).populate('user');

    if (!guider) {
        return next(new ApiError('Guider not found', 400));
    }

    res.status(200).json({ data: guider });
});

// @desc get all guiders
// @route GET /api/v1/guiders
// @access public
exports.getGuiders = asyncHandler(async (req, res, next) => {
    const guiders = await Guider.find().populate('user');
    res.status(200).json({ data: guiders });
});

// @desc get guider trips
// @route GET /api/v1/guiders/:id/trips
// @access public
exports.getGuiderTrips = asyncHandler(async (req, res, next) => {
    const guider = await Guider.findById(req.params.id);
    if (!guider) {
        return next(new ApiError('Guider not found', 400));
    }

    const trips = await Trip.find({ guider: guider._id });
    res.status(200).json({ data: trips });
});

// @desc update guider
// @route PUT /api/v1/guiders/:id
// @access private (admin, guider)
exports.updateGuider = asyncHandler(async (req, res, next) => {
    const guider = await Guider.findByIdAndUpdate(req.params.id, req.body, { new: true });
    const user = await User.findById(guider.user);
    if (!user) {
        return next(new ApiError('User not found', 400));
    }
    user.role = 'guider';
    await user.save();
    if (!guider) {
        return next(new ApiError('Guider not found', 400));
    }
    res.status(200).json({ data: guider });
});


