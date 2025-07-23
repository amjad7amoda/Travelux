const express = require('express');

const router = express.Router();

const { register, login, verfiyEmail, resendCodeVerfication,
    forgotPassword, verifyResetCode, resetPassword } = require('../services/authServices');

const { localUserValidation, loginValidation } = require('../utils/validators/userValidator');
const { uploadAvatarImage, reSizeAndSaveAvatar } = require('../services/userServices');

//Sign In & Sign Up
router.post('/register', uploadAvatarImage, reSizeAndSaveAvatar, localUserValidation, register);
router.post('/login', loginValidation, login);
//Verify Email
router.post('/verifyEmail', verfiyEmail);
router.post('/resendCodeVerification', resendCodeVerfication);
//Forget Password
router.post('/forgetPassword', forgotPassword);
router.post('/verifyResetCode', verifyResetCode);
router.post('/resetPassword', resetPassword);

// router.post('/google/sign', googleUserValidation, verifyGoogleIdToken);
module.exports = router;