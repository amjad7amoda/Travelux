const TrainTrip = require('../../models/Trains/trainTripModel');
const Train = require('../../models/Trains/trainModel');
const cron = require('node-cron');
const asyncHandler = require('../../middlewares/asyncHandler');
const TrainTripBooking = require('../../models/Trains/trainTripBookingModel')

function scheduleTrainStatusCheck() {
    cron.schedule('* * * * *', asyncHandler(async () => {
        const now = new Date();
        // Update the status of the trains
        const expiredTrains = await Train.find({ 
            status: 'booked',
            $or: [
                { booked_until: { $lt: now } },
                { booked_until: { $exists: false } }
            ]
        });
        for(const train of expiredTrains){
            train.status = 'available';
            train.booked_until = undefined;
            await train.save();
            console.log(`Train Service Update | ${train.name} is available`)
        }


        // Update the trips that have reached the departure time
        const toOnWay = await TrainTrip.find({
            status: { $in: ['preparing'] },
            departureTime: { $lte: now },
            arrivalTime: { $gt: now }
        });
        for (const trip of toOnWay) {
            trip.status = 'onWay';
            await trip.save();
            console.log(`Train Service Update | Trip ${trip._id} is now onWay`);
        }
        // Update the status of the trips that have arrived
        const toCompleted = await TrainTrip.find({
            status: { $in: ['onWay', 'preparing'] },
            arrivalTime: { $lte: now }
        });
        for (const trip of toCompleted) {
            trip.status = 'completed';
            await trip.save();
            console.log(`Train Service Update | Trip ${trip._id} is now completed`);
        }

        //Update Train Trip Bookings To Complete So That Means It's Arrived.
        const completedBookings = await TrainTripBooking.find({
            status: 'active',
            arrivalTime: { $lt: Date.now() }
        });

        for(const book of completedBookings){
            book.status = 'completed';
            await book.save();
            console.log('Completed Ticket')
        }


    }));
}

module.exports =  scheduleTrainStatusCheck ;