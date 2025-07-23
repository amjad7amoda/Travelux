const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  office: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CarRentalOffice',
    required: true
  },
  brand: {
    type: String,
    trim: true,
    required: true
  },
  model: {
    type: String,
    trim: true,
    required: true
  },
  year: {
    type: Number,
    min: 1950,
    max: new Date().getFullYear(),
    required: true
  },
  gearType: {
    type: String,
    enum: ['manual', 'automatic'],
    default: 'manual',
  },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'electric', 'hybrid'],
    default: 'petrol',
  },
  seats: {
    type: Number,
    min: 2,
    max: 10,
    default: 5
  },
  color:{
    type: String,
    trim: true,
    minlength: [3, 'Color must be at least 3 characters long'],
    maxlength: [15, 'Color must be less than 15 characters'],
    required: true
  },
  pricePerDay: {
    type: Number,
    min: 1,
    required: true
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['available', 'booked', 'maintenance'],
    default: 'available'
  },
  booked_until: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema);