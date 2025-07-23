const express = require('express');

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
    UpdateUser 
} = require('../services/userServices');

const { protect, allowTo } = require('../services/authServices');

const { 
    updateLoggedUserValidator,
    changeLoggedUserPasswordValidator,
    getUserValidator,updateUserValidator
 } = require('../utils/validators/userValidator');

//routes for user
router.get('/profile', protect, profile);
router.put('/updateMe', protect, uploadAvatarImage, reSizeAndSaveAvatar, updateLoggedUserValidator, updateLoggedUser);
router.put('/changeMyPassword', protect,changeLoggedUserPasswordValidator, UpdateLoggedUserPassword);
router.delete('/deactiveMe', protect, deactiveLoggedUser);

//routes for admin
router.put('/updateUser/:id', protect, allowTo('admin'),updateUserValidator, UpdateUser);
router.get('/getAllUsers', protect, allowTo('admin'), getAllUsers);
router.get('/getUser/:id', protect, allowTo('admin'), getUserValidator,getUser);
module.exports = router;