const cron = require('node-cron');
const Car = require('../../models/Cars/carModel');
const CarBooking = require('../../models/Cars/carBookingModel');
const asyncHandler = require('../../middlewares/asyncHandler');

function scheduleCarStatusCheck() {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            const currentDate = new Date();

            // Find all confirmed bookings that have ended
            const expiredBookings = await CarBooking.find({
                status: 'confirmed',
                endDate: { $lt: currentDate }
            });

            // Update expired bookings to completed
            for (const booking of expiredBookings) {
                booking.status = 'completed';
                await booking.save();
                console.log(`Booking Updated | Booking ${booking._id} status updated to completed`);
                
                // Also update car status if this was the last active booking
                const car = await Car.findById(booking.car);
                if (car && car.status === 'booked') {
                    // Check if there are any other active bookings for this car
                    const activeBookings = await CarBooking.find({
                        car: car._id,
                        status: { $in: ['pending', 'confirmed'] }
                    });
                    
                    if (activeBookings.length === 0) {
                        car.status = 'available';
                        car.booked_until = null;
                        await car.save();
                        console.log(`Car Updated | Car ${car._id} status updated to available`);
                    }
                }
            }
        } catch (error) {
            console.log('Error in car status check:', error);
        }
    });
}

module.exports = scheduleCarStatusCheck;