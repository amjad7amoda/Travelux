const cron = require('node-cron');
const Train = require('../../models/Trains/trainModel');
const asyncHandler = require('../../middlewares/asyncHandler');
const TrainTrip = require('../../models/Trains/trainTripModel');

function scheduleTrainStatusCheck() {
    cron.schedule('* * * * *', asyncHandler( async () => {
        const now = new Date();
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
            console.log(`[CRON] Updated | ${train.name} is available`)
        }
    }));
    // const now = new Date();
    // const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // const tripsToUpdate = await TrainTrip.updateMany({
    //         status: 'preparing',
    //         departureTime: { $lte: next24h }
    //     },{
    //         $set: { status: 'prepared' } 
    //     }
    // );
    // console.log(`[CRON] Updated | ${tripsToUpdate.modifiedCount} trip(s) to 'prepared'`);
    // }));
}

module.exports = scheduleTrainStatusCheck;