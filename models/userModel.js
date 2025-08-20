const mongoose = require('mongoose');
const validate = require('validate');
const bcrypt = require('bcrypt')

const userSchema = mongoose.Schema({
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        select: false
    },
    
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters'],
        maxlength: [50, 'First name cannot exceed 50 characters'],
        match: [/^[a-zA-Z\u0600-\u06FF\s\-']+$/, 'First name can only contain letters']
      },
    lastName: {
        type: String,
        required: [true, 'Family name is required'],
        trim: true,
        minlength: [2, 'Family name must be at least 2 characters'],
        maxlength: [50, 'Family name cannot exceed 50 characters'],
        match: [/^[a-zA-Z\u0600-\u06FF\s\-']+$/, 'Family name can only contain letters']
      },

    //The email and verfication rows
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: String,
    verificationCodeExpires: Date,

    //Password and its configurations
    password: {
        type: String,
        minlength: 8,
        select: false
    },
    passwordChangedAt:Date,
    passwordResetCode:String,
    passwordResetExp:Date,
    passwordResetCodeVerifiy:Boolean,

    provider: {
        type: String,
        required: true,
        lowercase: true,
        enum: ['local', 'google'],
        default: 'local'
    },

    role: {
        type: String,
        enum: ['owner', 'admin', 'supporter', 'guider', 'user', 'hotelManager', 'airlineOwner', 'routeManager', 'officeManager'],
        required: [true, 'You should have a role'],
        default: 'user'
    },
    active:{
        type:Boolean,
        default:true
    },

    avatar: String,

},{timestamps: true});

userSchema.pre('save', async function(next){
    if(this.provider !== 'local' || !this.isModified('password'))
        return next();

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
        next(); 
    } catch (err) {
        next(err); 
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    if (this.provider !== 'local') {
        throw new Error('Password comparison only available for local accounts');
    }
    return await bcrypt.compare(candidatePassword, this.password);
}

userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);