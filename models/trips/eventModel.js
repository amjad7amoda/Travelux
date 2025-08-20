const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config();

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: [3, 'Event title must be at least 3 characters'],
        maxlength: [50, 'Event title must be less than 50 characters'],
    },
    description: {
        type: String,
        required: true,
        minlength: [10, 'Event description must be at least 10 characters'],
        maxlength: [1000, 'Event description must be less than 1000 characters'],
    },
    cover: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },

}, {
    timestamps: true,
});


// get one && get all && update
eventSchema.post('init',async(doc)=>{
    if(doc.cover){
        const coverUrl =`${process.env.BASE_URL}/events/${doc.cover}`;
        doc.cover = coverUrl;
    }
})
const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
