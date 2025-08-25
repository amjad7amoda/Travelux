const mongoose = require('mongoose');

const userFcmTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fcmToken: {
    type: String,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('UserFcmToken', userFcmTokenSchema);
