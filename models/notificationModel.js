const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: [
      'flight',   
      'hotel',    
      'train',    
      'car',
      'trip',
      'payment',
      'promotion',
      'other'     
    ],
    required: true
  }
}, { 
  timestamps: true 
});

// Create indexes for better query performance
notificationSchema.index({ user: 1, date: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema); 