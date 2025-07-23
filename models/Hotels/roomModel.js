const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel",
        required: [true, "Hotel is required"],
    },
    roomType: {
        type: String,
        required: [true, "Room type is required"],
        enum: ["Single", "Double", "Suite"],
    },
    capacity: {
        type: Number,
        required: [true, "Room capacity is required"],
        min: [1, "Room capacity must be at least 1"],
        max: [10, "Room capacity must be less than 10"],
    },
    pricePerNight: {
        type: Number,
        required: [true, "Room price per night is required"],
        min: [1, "Room price per night must be at least 1"],
        max: [10000, "Room price per night must be less than 10000"],
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    roomNumber: {
        type: String,
        required: [true, "Room number is required"],
    },
    amenities: {
        type: [String],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    },
    image: {
        type: String,
        // required: [true, "Room image is required"],
    },
},
    {
        timestamps: true,
    });

// Create a compound index for hotel and roomNumber to ensure uniqueness within the same hotel
roomSchema.index({ hotel: 1, roomNumber: 1 }, { unique: true });

// Add a custom validator to provide a more descriptive error message
roomSchema.path('roomNumber').validate(async function (value) {
    if (!this.hotel) return true; // Skip validation if hotel is not set yet

    const Room = this.constructor;
    const existingRoom = await Room.findOne({
        hotel: this.hotel,
        roomNumber: value,
        _id: { $ne: this._id } // Exclude current room when updating
    });

    if (existingRoom) {
        throw new Error('Room number must be unique within the same hotel');
    }

    return true;
}, 'Room number must be unique within the same hotel');

const setImageURL = (doc) => {
    if (doc.image) {
        if (!doc.image.startsWith('http')) {
            const imageUrl = `${process.env.BASE_URL}/rooms/${doc.image}`;
            doc.image = imageUrl;
        }
    }
}

roomSchema.post('init', setImageURL);
roomSchema.post('save', setImageURL);

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;

