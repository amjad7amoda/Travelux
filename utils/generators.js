const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

exports.generateVerificationCode = async function (userId = null) {
    
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق بالمللي ثانية

    if(userId){
        await UserModel.findByIdAndUpdate(
        userId,
        {
            verificationCode,
            verificationCodeExpires
        },
        { new: true }
    );
    }

    return {
        verificationCode,
        verificationCodeExpires
    };
};


exports.generateToken =  function (userId , expiresIn = process.env.JWT_EXPIRED_IN)  {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: expiresIn })
}
    
