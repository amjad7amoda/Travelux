/* ====== Imports ======= */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { generateToken, generateVerificationCode} = require('../utils/generators');
const UserModel = require('../models/userModel')
const ApiError = require('../utils/apiError');
const asyncHandler = require('../middlewares/asyncHandler');
const sendEmail = require('../utils/sendEmail');

//======== utils auth function ========//
// @desc verify token
async function verifyToken(token) {
    const decoded = await jwt.verify(token, process.env.JWT_SECRET); 
    return decoded.userId;
};

/* ======= Exports =======*/
// @desc Register an account
// @route post /api/auth/register
// @access public
exports.register = asyncHandler(
    async (req, res, next) => {
        const { firstName, lastName, email, password, avatar } = req.body;

        const verification = await generateVerificationCode();
            await sendEmail({
                email: email,
                subject: 'Verify Your account',
                message: `Your verification code is: ${verification.verificationCode}`
            });
        
        await UserModel.create({
            firstName,
            lastName,
            email,
            password, 
            provider: 'local',
            avatar: avatar,
            verificationCode: verification.verificationCode,
            verificationCodeExpires: verification.verificationCodeExpires
        });

        console.log('verificationCode:',verification.verificationCode);

        res.status(201).json({status:"SUCCESS",message: "User registered successfully, Please verify your email."});

    }
);

// @desc Login to your account
// @route post /api/auth/login
// @acess public
exports.login = asyncHandler(
    async(req, res, next) => {
        const { email, password } = req.body
    
        //Check if the email and password was sended
        if (!email || !password) {
            return res.status(400).json({
              success: false,
              message: 'The email and password are required'
            });
          }
    
        //Check if user is exists
        const user = await UserModel.findOne({ email }).select('+password');
        if (!user) {
          return res.status(401).json({ 
            success: false,
            message: 'Credentials are not matched'
          });
        }
    
        //Check if the password and email are matched
        const isMatch = await user.comparePassword(password);
        if(!isMatch)
            return res.status(400).send({
            success: false,
            message: 'Credentials are not matched'
        }
    )
    
    if(!user.isVerified){
        const verification = await generateVerificationCode(user._id);
        await sendEmail({
            email,
            subject: 'Verify Your Account',
            message: `Your verification code is ${verification.verificationCode}`
        });
        return res.status(401).send({
            status: 'failed',
            message: 'Your account not verified we sent you a new verfication code.'
        })
    }
    //check if user active , if not make it active
    if(!user.active) user.active = true;
    await user.save();

        //Generate Token
        const token = generateToken({
            userId: user._id
        });

        
        res.status(200).json({status:"SUCCESS",message:  "Logged in successfulyy",data:{user,token}});
        
    }
    
);


// @desc Verify your email
// @route post /api/auth/verifyEmail
// @access public 
exports.verfiyEmail = asyncHandler(
    async(req, res, next) => {
        const { email, verificationCode} = req.body;
        const user = await UserModel.findOne({ email });
        if(!user)
            return next(new ApiError('User is not defined', 404))

        if(user.isVerified)
            return next(new ApiError('User already verified', 400))

        if(user.verificationCode !== verificationCode)
            return next(new ApiError('Invalid verification code', 400))

        if(user.verificationCodeExpires < Date.now())
            return next(new ApiError("Verification code expired", 400))

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        const token = generateToken({ userId: user._id });
                
        res.status(200).json({status:"SUCCESS",message: "Email verified successfully",data:{user,token}});
    } 
);

// @desc Resend verification code
// @route post /api/auth/resendCodeVerify
// @access public
exports.resendCodeVerfication = asyncHandler(async(req, res, next) => {
    const { email } = req.body;
    const user = await UserModel.findOne({email});

    if(!user)
        return next(new ApiError('User is not defined', 404));

    if(user.isVerified === true)
        return next(new ApiError('User is already verified.', 400))

    const { verificationCode, verificationCodeExpires } = await generateVerificationCode(user._id);
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    user.save();

    await sendEmail({
        email: user.email,
        subject: 'Verify Your account',
        message: verificationCode
    });
    res.status(200).json({status:"SUCCESS",message: 'Verification Code Re-sent successfully'});
});

// @desc forget password
// @route get /api/auth/forgetPassword
// @access public
exports.forgotPassword = asyncHandler(async(req,res,next)=>{

    //1)-get user by email
    const{ email } = req.body;
    const user = await UserModel.findOne({email});
    if(!user) 
        return next(new ApiError('User not found', 404));
    
    //2)- if user exist , generate random 6 digit and save it in db
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    //3)- save hashed reset code
    user.passwordResetCode = hashedResetCode;
    user.passwordResetExp = Date.now()+10*60*1000; //10 Minutes
    user.passwordResetCodeVerifiy = false;
    
    await user.save();

    //4)- send resetCode via email
    await sendEmail({
        email:user.email,
        subject:"Reset Your Password",
        message: resetCode
    });
    res.status(200).json({status:"SUCCESS",message:  "Your password's reset code has sent."});
})

// @desc verify resetCode
// @route get /api/auth/verifyResetCode
// @access public
exports.verifyResetCode = asyncHandler(async(req,res,next)=>{

    //Find the hashedResetCode From (req.body.resetCode)
    const { resetCode } = req.body;
    const hashedResetCode = crypto.createHash('sha256')
    .update(resetCode).digest('hex');

    //Find user using the hashedResetCode 
    const user = await UserModel.findOne({
        passwordResetCode:hashedResetCode,
        passwordResetExp:{$gt:Date.now()}
    });

    if(!user) 
        return next(new ApiError('Invalid or expired reset code', 404));

    user.passwordResetCodeVerifiy = true;
    await user.save();

    res.status(200).json({status:"SUCCESS",message: ".password Reset Code Verified succesfuly"});

})

// @desc set new password
// @route get /api/auth/resetPassword
// @access public
exports.resetPassword = asyncHandler(async(req,res,next)=>{
    
    const { email, newPassword } = req.body;
    const user = await UserModel.findOne({email});

    if(!user) 
        return next(new ApiError('User not found', 404));

    if(!user.passwordResetCodeVerifiy) 
        return next(new ApiError('passwordResetCodeVerifiy is not verified', 400));

    //Update Password
    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    user.passwordResetCode = undefined;
    user.passwordResetCodeVerifiy = false;
    user.passwordResetExp=undefined;
    await user.save();

    //Generate A new token and return the result.
    const token =  generateToken({ userId: user._id })
    res.status(200).json({status:"SUCCESS",data:{user,token}});
})

// async function loginOrRegister(payload) {
//         try {
//             // eslint-disable-next-line camelcase
//             const { sub, email, name, given_name, family_name, picture } = req.googlePayload;
//             let user = await UserModel.findOne({ googleId: sub });
    
//             if (!user) {
//                 user = await UserModel.create({
//                     googleId: sub,
//                     email,
//                     // eslint-disable-next-line camelcase
//                     first_name: given_name,
//                     // eslint-disable-next-line camelcase
//                     last_name: family_name,
//                     provider: 'google',
//                     picture
//                 });
//             }

//             //Generate A verficationCode and It's Expiration.
//             const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
//             const verificationCodeExpires = Date.now() + 10*60*1000;
//             await user.update(verificationCode, verificationCodeExpires);

//             const token = generateToken({userId: user._id});

//             res.json({ 
//                 success: true,
//                 message: "Verification code sent to your email.",
//                 user,
//                 token
//             });
//         } catch (error) {
//             console.error("Registration Error:", error);
//             res.status(500).json({ error: "Internal server error" });
//         }
// };
// exports.verifyGoogleIdToken = asyncHandler(
//     async (req, res, next) => {
//         const oauthClient = new OAuth2Client(process.env.ANDROID_CLIENT_ID);
//         const { idToken } = req.body;
    
        
//         if (!idToken || typeof idToken !== 'string') {
//             return res.status(400).json({ error: "Invalid token format" });
//         }
    
//         try {
//             // console.log(process.env.GOOGLE_CLIENT_ID)
//             const ticket = await oauthClient.verifyIdToken({
//                 idToken: idToken.trim(), 
//                 audience: [
//                     process.env.GOOGLE_CLIENT_ID,
//                     process.env.ANDROID_CLIENT_ID
//                 ]
//             });
//             //Signture 


//             const payload = ticket.getPayload();
//             loginOrRegister(payload);
            
//         } catch (e) {
//             console.error('Google Auth Error:', e);
//             res.status(401).json({ error: "Invalid Google token" });
//         }
//     }
// )


/* ====== Some Auth Middlewares ======== */
// @desc make sure user logged in
exports.protect = asyncHandler(
    async (req, res, next) => {

    // 1) Check if token exists
    let token;
    if (req.headers.authorization)
        token = req.headers.authorization.split(' ')[1];

    if (!token || token === null) 
        return next(new ApiError('Not authorized, no token', 401));
    // 2) Verify token
    let decoded;
    try {
        decoded = await verifyToken(token);
    } catch (err) {
        // Handle different JWT errors specifically
        if (err.name === 'JsonWebTokenError') {
            return next(new ApiError('Invalid token', 401));
        }
        if (err.name === 'TokenExpiredError') {
            return next(new ApiError('Token expired', 401));
        }
        return next(new ApiError('Authentication failed', 401));
    }

    // 3) Check if user exists
    const currentUser = await UserModel.findById(decoded.userId);
    if (!currentUser) {
        return next(new ApiError('User no longer exists', 401));
    }
    //4)- check if user active
    if(!currentUser.active) return next(new ApiError('user not active',401));

    // Grant access
    req.user = currentUser;
    next();
});

// @desc authorization
exports.allowTo=(...roles)=>asyncHandler(
    async(req,res,next) => {
    if(!roles.includes(req.user.role)) return next(new ApiError(`You don't have permissions.`, 403)); 
    next();
});



