const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Hotel name is required"],
        minlength: [3, "Hotel name must be at least 3 characters long"],
        maxlength: [30, "Hotel name must be less than 30 characters long"],
        unique: [true, "Hotel name must be unique"],
    },
    slug: {
        type: String,
        lowercase: true,
    },
    location: {
        type: String,
        required: [true, "Hotel location is required"],
    },
    country: {
        type: String,
        required: [true, "Hotel country is required"],
        minlength: [3, "Hotel country must be at least 3 characters long"],
        maxlength: [30, "Hotel country must be less than 30 characters long"],
    },
    city: {
        type: String,
        required: [true, "Hotel city is required"],
        minlength: [3, "Hotel city must be at least 3 characters long"],
        maxlength: [30, "Hotel city must be less than 30 characters long"],
    },
    description: {
        type: String,
        required: [true, "Hotel description is required"],
        minlength: [3, "Hotel description must be at least 3 characters long"],
        maxlength: [30, "Hotel description must be less than 30 characters long"],
    },
    amenities: { // Additions like pool, gym, etc.
        type: [String],
        required: [true, "Hotel amenities are required"],
    },
    hotelManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Hotel manager is required"],
        immutable: true
    },
    stars: {
        type: Number,
        required: [true, "Hotel stars are required"],
        min: [1, "Hotel stars must be at least 1"],
        max: [5, "Hotel stars must be less than 5"],
    },
    coverImage: {
        type: String,
        // required: [true, "Hotel cover image is required"],
    },
    images: {
        type: [String],
        // required: [true, "Hotel images are required"],
    },
},
    {
        timestamps: true,
    }
);

const setImageURL = (doc) => {
    if (doc.coverImage) {
        // Check if the image is already a full URL
        if (!doc.coverImage.startsWith('http')) {
            const imageUrl = `${process.env.BASE_URL}/hotels/${doc.coverImage}`;
            doc.coverImage = imageUrl;
        }
    }
    if (doc.images) {
        const imagesList = [];
        doc.images.forEach((image) => {
            // Check if the image is already a full URL
            if (!image.startsWith('http')) {
                const imageUrl = `${process.env.BASE_URL}/hotels/${image}`;
                imagesList.push(imageUrl);
            } else {
                imagesList.push(image);
            }
        });
        doc.images = imagesList;
    }
};

hotelSchema.post('init', setImageURL);
hotelSchema.post('save', setImageURL);

hotelSchema.virtual('rooms', {
    ref: 'Room',
    foreignField: 'hotel',
    localField: '_id'
});

hotelSchema.set('toObject', { virtuals: true });
hotelSchema.set('toJSON', { virtuals: true });


const Hotel = mongoose.model("Hotel", hotelSchema);

module.exports = Hotel;