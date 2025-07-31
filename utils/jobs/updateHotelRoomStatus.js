const cron = require('node-cron');
const Room = require('../../models/Hotels/roomModel');
const Booking = require('../../models/Hotels/hotelBookingModel');
const asyncHandler = require('../../middlewares/asyncHandler');

function scheduleHotelRoomStatusCheck() {
    // Run every 4 hours (at minute 0 of every 4th hour: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
    cron.schedule('0 */4 * * *', async () => {
        try {
            const currentDate = new Date();

            // Find all paid bookings that have ended (checkOutDate has passed)
            const expiredBookings = await Booking.find({
                paymentStatus: 'paid',
                status: 'active',
                checkOutDate: { $lt: currentDate }
            });

            // Update expired bookings to expired status
            await Promise.all(expiredBookings.map(async (booking) => {
                // Update booking status to expired
                booking.status = 'expired';
                await booking.save();
                console.log(`Hotel Booking Updated | Booking ${booking._id} status updated to expired`);

                // Update room availability
                const room = await Room.findById(booking.room);
                if (room && !room.isAvailable) {
                    // Check if there are any other active bookings for this room
                    const activeBookings = await Booking.find({
                        room: room._id,
                        status: 'active'
                    });

                    // If no active bookings, make the room available
                    if (activeBookings.length === 0) {
                        room.isAvailable = true;
                        await room.save();
                        console.log(`Room Updated | Room ${room._id} (${room.roomNumber}) is now available`);
                    }
                }
            }));
        } catch (error) {
            console.log('Error in hotel room status check:', error);
        }
    });
}

module.exports = scheduleHotelRoomStatusCheck; 