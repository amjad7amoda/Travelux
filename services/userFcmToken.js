const UserFcmToken = require('../models/userFcmTokenModel');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/apiError');
const User = require('../models/userModel');

// @desc save fcm token
// @route post /api/user-fcm-tokens
// @access private [user]
exports.saveFcmToken = asyncHandler(async (req, res, next) => {
    const { fcmToken } = req.body;
    // find user
    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ApiError('User not found', 404));
    }

    // check if the fcm token already exists remove it first
    await UserFcmToken.findOneAndDelete({ user: user._id });

    // save the new fcm token
    const fcmTokenCreated = await UserFcmToken.create({ user: user._id, fcmToken });
    res.status(201).json({ message: 'Fcm token saved successfully'});
});