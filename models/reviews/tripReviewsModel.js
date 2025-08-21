const  mongoose  = require("mongoose");
const Trip = require('../trips/tripModel');
const User = require('../userModel');

const tripReviewSchema = new mongoose.Schema({
    title:{
        type:String,
    },
    rating:{
        type:Number,
        min:[1,'min rating is 1'],
        max:[5,'max rating is 5'],
        required:[true,'rating for review is required']
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:[true,'review owner is required']
    },
    trip:{
        type:mongoose.Schema.ObjectId,
        ref:'Trip',
        required:[true,'trip for review is required']
    }
},{timestamps:true})




tripReviewSchema.statics.calcAverageRatingAndQuantity = async function(tripId) {
    // calculate rating average and rating quantity
    const result = await this.aggregate([
        //stage 1 : get all reviews in specific trip
        {$match: {trip:tripId}},
        //stage 2 : group all reviews of specific trip and calculate avg and ratingsQuantity
        {$group: {_id:"trip", ratingsAverage:{$avg:"$rating"},ratingsQuantity:{$sum:1}}}
    ]);
    
    // update data of trip
    if(result.length>0){
        await Trip.findByIdAndUpdate(tripId,{
            ratingsAverage:result[0].ratingsAverage,
            ratingsQuantity:result[0].ratingsQuantity,
        });
    }
    else{
        await Trip.findByIdAndUpdate(tripId,{
            ratingsAverage:0,
            ratingsQuantity:0,
        });
    };
};

// calculate in create and update 
tripReviewSchema.post('save',async function(){
    await this.constructor.calcAverageRatingAndQuantity(this.trip);
})

// save trip id before delete
tripReviewSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    this._tripId = this.trip;
    next();
});
// calculate after delete
tripReviewSchema.post('deleteOne', { document: true, query: false }, async function () {
    if (this._tripId) {
        await this.constructor.calcAverageRatingAndQuantity(this._tripId);
    }
});


module.exports = mongoose.model('TripReview', tripReviewSchema);