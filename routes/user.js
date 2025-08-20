const express = require('express');
const validObjectId = require('../middlewares/validObjectId');
const router = express.Router();
const { 
    getAllUsers,
    profile,
    updateLoggedUser,
    uploadAvatarImage,
    reSizeAndSaveAvatar,
    getUser, 
    UpdateLoggedUserPassword, 
    deactiveLoggedUser, 
    UpdateUser,
    getAllUsersWithBookings
} = require('../services/userServices');

const { protect, allowTo } = require('../services/authServices');

const { 
    updateLoggedUserValidator,
    changeLoggedUserPasswordValidator,
    getUserValidator,updateUserValidator
 } = require('../utils/validators/userValidator');

//=============================== User Routes ===============================
// @desc Get user profile
// @route GET /api/users/profile
// @access Private(user)
router.get('/profile', protect, profile);   

// @desc Update user profile
// @route PUT /api/users/updateMe
// @access Private(user)
router.put('/updateMe', 
    protect, 
    uploadAvatarImage, 
    reSizeAndSaveAvatar, 
    updateLoggedUserValidator, 
    updateLoggedUser
);

// @desc Change user password
// @route PUT /api/users/changeMyPassword
// @access Private(user)
router.put('/changeMyPassword', 
    protect,
    changeLoggedUserPasswordValidator, 
    UpdateLoggedUserPassword
);

// @desc Deactive user
// @route DELETE /api/users/deactiveMe
// @access Private(user)
router.delete('/deactiveMe', 
    protect, 
    deactiveLoggedUser
);





//=============================== Admin Routes ===============================
//routes for admin
// @desc Update user
// @route PUT /api/users/:id
// @access Private(admin)
router.put('/:id', 
    validObjectId,
    protect, allowTo('admin'), 
    updateUserValidator, 
    UpdateUser);

// @desc Get all users
// @route GET /api/users/getAllUsers
// @access Private(admin)
router.get('/getAllUsers', 
    protect, allowTo('admin'), 
    getAllUsers);

// @desc Get user
// @route GET /api/users/getUser/:id
// @access Private(admin)
router.get('/getUser/:id', 
    validObjectId,
    protect, allowTo('admin'), 
    getUserValidator,getUser
);

// @desc Get all users with bookings
// @route GET /api/users/getAllUsersWithBookings
// @access Private(admin)
router.get('/getAllUsersWithBookings',
    protect, 
    allowTo('admin'), 
    getAllUsersWithBookings
);

module.exports = router;