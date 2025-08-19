const cron = require('node-cron');
const Flight = require('../../models/flightModel');
const FlightTicket = require('../../models/flightTicketModel');

function scheduleFlightStatusCheck() {
    // Run every 2 hours
    cron.schedule('0 */2 * * *', async () => {
        try {
            const currentDate = new Date();

            // Update flights to onTheWay when current time passes departure time
            const onTheWayResult = await Flight.updateMany(
                {
                    status: 'pending',
                    departureDate: { $lt: currentDate }
                },
                {
                    status: 'onTheWay'
                }
            );

            // Find flights that need to be marked as successful
            const flightsToUpdate = await Flight.find({
                status: 'onTheWay',
                arrivalDate: { $lt: currentDate }
            });

            // Update each flight and handle tickets if it's a return flight
            for (const flight of flightsToUpdate) {
                try {
                    // Update flight status to successful
                    flight.status = 'successful';
                    await flight.save();

                    // If this is a return flight, update associated tickets to expired
                    if (flight.tripType === 'return') {
                        await FlightTicket.updateMany(
                            { returnFlight: flight._id },
                            { status: 'expired' }
                        );
                    }
                } catch (flightError) {
                    console.error(`Error processing flight ${flight._id}:`, flightError);
                }
            }
        } catch (error) {
            console.error('Error updating flight statuses:', error);
        }
    });
}

module.exports = scheduleFlightStatusCheck;