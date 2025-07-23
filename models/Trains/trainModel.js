const mongoose = require('mongoose');

const trainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Train name is required'],
    trim: true,
    minlength: [2, 'Train name must be at least 2 characters'],
    maxlength: [100, 'Train name must be at most 100 characters']
  },
  speed: {
    type: Number,
    required: [true, 'Train speed is required'],
    min: [50, 'Speed must be a positive number']
  },
  numberOfSeats: {
    type: Number,
    required: [true, 'Number of seats is required'],
    min: [1, 'There must be at least 1 seat'],
    validate: {
      validator: Number.isInteger,
      message: 'Number of seats must be an integer'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['booked', 'maintenance', 'out_of_service', 'available'],
      message: 'Invalid train status'
    },
    default: 'available',
    required: true
  },
  booked_until: {
    type: Date,
    validate: {
      validator: function (value) {
        if (this.status === 'booked') {
          return value && value > new Date();
        }
        return true;
      },
      message: 'booked_until must be a future date when status is "booked"'
    }
  }
});

module.exports = mongoose.model('Train', trainSchema);