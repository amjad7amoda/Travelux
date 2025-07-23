// eslint-disable-next-line node/no-unsupported-features/node-builtins
const fs = require('fs').promises;
// eslint-disable-next-line import/no-extraneous-dependencies
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');
const path = require('path');
const asyncHandler = require('../middlewares/asyncHandler');
const { generateToken } = require('../utils/generators');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');
const Factory = require('./handlersFactory');
const UserModel = require('../models/userModel');
const ApiError = require('../utils/apiError');


// @desc Get all users
// @route get /api/user/getAllUsers
// @access private (admin)
exports.getAllUsers = Factory.GetAll(UserModel);

// @desc get specific user
// @route get /api/users/:id
// @access private (admin)
exports.getUser=Factory.GetOne(UserModel);

// @desc Profile info
// @route get /api/user/profile
// @access private (user)
exports.profile = asyncHandler(
    async (req, res, next) => {

        const {user} = req;

        if(!user)
            return next(new ApiError('User not defined', 404));

        res.status(200).json({status:"SUCCESS",data:{user}});
    }
)

// @desc update specific user by admin except password
// @route put /api/users/:id
// @access private
exports.UpdateUser=asyncHandler(async(req,res,next)=>{
    const { firstName, lastName,role ,isVerified,email,active} = req.body;
    // get user from db by id
    const user = await UserModel.findById(req.params.id);
    if(!user)
        return next(new ApiError('User not found',404));

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (typeof isVerified !== "undefined") user.isVerified = isVerified;
    if (email) user.email = email;
    if (typeof active !== "undefined") user.active = active;
    if(req.file && user.avatar && user.avatar.includes('/uploads/users/')){
            const oldFileName = user.avatar.split('/uploads/users/')[1];
            const oldImagePath = path.join(__dirname, '..', 'uploads', 'users', oldFileName);
            try{
                await fs.access(oldImagePath)
                await fs.unlink(oldImagePath);
            }catch(error){
                console.warn('WARNING: Faild to delete old avatar', error.message)
            }
        }
    user.avatar = req.body.avatar;
    
    await user.save();
    const token = generateToken({ userId: user._id });
    res.status(200).json({status:"SUCCESS",message: 'User updated successfully',data:{user,token}});
})

// @desc Update user information except password
// @route put /api/user/update
// @access private (user)
exports.updateLoggedUser = asyncHandler(async (req, res, next) => {
        const { firstName, lastName } = req.body;
        const {user} = req;

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;

        if(req.file && user.avatar && user.avatar.includes('/uploads/users/')){
                const oldFileName = user.avatar.split('/uploads/users/')[1];
                const oldImagePath = path.join(__dirname, '..', 'uploads', 'users', oldFileName);
                try{
                    await fs.access(oldImagePath)
                    await fs.unlink(oldImagePath);
                }catch(error){
                    console.warn('WARNING: Faild to delete old avatar', error.message)
                }
            }
        user.avatar = req.body.avatar;

        await user.save();
        const token = generateToken({ userId: user._id });
        res.status(200).json({status:"SUCCESS",message: 'User updated successfully',data:{user,token}});
});

// @desc update logged user password
// @route put /api/users/changeMyPassword
// @access private
exports.UpdateLoggedUserPassword=asyncHandler(async(req,res,next)=>{
    // update password
    const newDoc = await UserModel.findByIdAndUpdate(req.user._id,{
        password:await bcrypt.hash(req.body.newPassword,12),
    },{new:true});
    if(!newDoc)
            return next(new GlobalErrorHandler("Doc not found",404));
    res.status(200).json({status:"SUCCESS",data:{newDoc}});
})

// @desc de active logged user
// @route delete /api/users/deactiveMe
// @access private
exports.deactiveLoggedUser=asyncHandler(async(req,res,next)=>{
    // deavtive
    const newDoc = await UserModel.findByIdAndUpdate(req.user._id,{
        active:false,
    },{new:true});
    if(!newDoc)
            return next(new GlobalErrorHandler("user not found",404));
    res.status(200).json({status:"SUCCESS"});
})

// @desc upload photo
exports.uploadAvatarImage = uploadSingleImage('avatar');

// @desc resize the image and handle it to the req
exports.reSizeAndSaveAvatar = asyncHandler(
    async (req, res, next) => {
        if (req.file) {
            const avatarFileName = `user-${uuidv4()}-${Date.now()}-avatar.jpeg`;
            const imagePath = `uploads/users/${avatarFileName}`;
           
            await sharp(req.file.buffer)
                .resize(1000, 1000)
                .toFormat('jpeg')
                .toFile(imagePath)
        
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            req.body.avatar = `${baseUrl}/${imagePath.replace(/\\/g, '/')}`;
        }
        next();
    }
);