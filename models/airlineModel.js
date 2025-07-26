const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config();
const Plane = require("./planeModel");

const airlineSchema = new mongoose.Schema({
    // sended by airline owner when creating the airline
    name: {
        type: String,
        required: true,
        minlength: [3, 'Airline name must be at least 3 characters'],
        maxlength: [50, 'Airline name must be less than 50 characters'],
    },
    // sended by airline owner when creating the airline
    description: {
        type: String,
        required: true,
        minlength: [10, 'Airline description must be at least 10 characters'],
        maxlength: [1000, 'Airline description must be less than 1000 characters'],
    },
    // sended by airline owner when creating the airline
    country: {
        type: String,
        required: true,
        minlength: [3, 'Country must be at least 3 characters'],
        maxlength: [50, 'Country must be less than 50 characters'],
    },
    // sended by airline owner when creating the airline
    logo: {
        type: String,
        required: true,
    },
    // id of the user who created the airline (airline owner)
    // auto filled from req.user._id
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    destinationCountries: {
        type: String,
        default: '+44',
    },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


// get one && get all && update
airlineSchema.post('init',async(doc)=>{
    if(doc.logo){
        const logoUrl =`http://localhost:${process.env.PORT}/airlines/${doc.logo}`;
        doc.logo = logoUrl;
    }
})

airlineSchema.virtual('planesNum',{
    ref:"Plane",
    foreignField:"airline",
    localField:"_id",
    count:true
});

const Airline = mongoose.model("Airline", airlineSchema);

module.exports = Airline;
