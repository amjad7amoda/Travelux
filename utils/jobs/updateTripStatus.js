const cron = require('node-cron');
const Trip = require('../../models/trips/tripModel');
const TripTicket = require('../../models/trips/tripTicketModel');
const asyncHandler = require('../../middlewares/asyncHandler');

function scheduleTripStatusCheck() {
    // Run every 3 hours
    cron.schedule('0 */3 * * *', async () => {
        try {
            const currentDate = new Date();

            // Find trips with status 'pending' where the first event start time has passed
            const tripsToStart = await Trip.find({
                status: 'pending',
                'events.0.startTime': { $lt: currentDate }
            });

            // Update trips to 'onTheWay' when first event time has passed
            for (const trip of tripsToStart) {
                try {
                    trip.status = 'onTheWay';
                    await trip.save();
                } catch (tripError) {
                    console.error(`Error updating trip ${trip._id} to onTheWay:`, tripError);
                }
            }

            // Find trips with status 'onTheWay' where the last event end time has passed
            const tripsToComplete = await Trip.find({
                status: 'onTheWay'
            });

            for (const trip of tripsToComplete) {
                try {
                    // Check if the last event end time has passed
                    if (trip.events && trip.events.length > 0) {
                        // Get the last event (highest order number)
                        const lastEvent = trip.events.reduce((latest, current) => {
                            return (current.order > latest.order) ? current : latest;
                        });

                        if (lastEvent.endTime < currentDate) {
                            // Update trip status to completed
                            trip.status = 'completed';
                            await trip.save();

                            // Update all trip tickets to expired
                            await TripTicket.updateMany(
                                { trip: trip._id },
                                { status: 'expired' }
                            );
                        }
                    }
                } catch (tripError) {
                    console.error(`Error processing trip ${trip._id}:`, tripError);
                }
            }
        } catch (error) {
            console.error('Error updating trip statuses:', error);
        }
    });
}

module.exports = scheduleTripStatusCheck;
