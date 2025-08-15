const cron = require('node-cron');
const Car = require('../../models/Cars/carModel');
const CarBooking = require('../../models/Cars/carBookingModel');
const Bill = require('../../models/Payments/billModel');
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

    // Check for unpaid bookings every minute and remove them after 1 hour
    cron.schedule('* * * * *', async () => {
        try {
            const currentDate = new Date();
            const oneHourAgo = new Date(currentDate.getTime() - (60 * 60 * 1000));
            
            const unpaidBookings = await CarBooking.find({
                paymentStatus: 'pending_payment',
                createdAt: { $lt: oneHourAgo }
            });

            for (const booking of unpaidBookings) {
                try {
                    const bill = await Bill.findOne({
                        user: booking.user,
                        status: 'continous'
                    });

                    if (bill) {
                        const existingItem = bill.items.find(item => 
                            item.bookingId.toString() === booking._id.toString() && 
                            item.bookingType === 'CarBooking'
                        );
                        if (existingItem) {
                            // Remove the booking item from bill
                            bill.items = bill.items.filter(item => 
                                !(item.bookingId.toString() === booking._id.toString() && item.bookingType === 'CarBooking')
                            );
                            
                            // Subtract the deleted booking price from total price
                            bill.totalPrice = Math.max(0, bill.totalPrice - booking.totalPrice);
                            
                            await bill.save();
                        }
                    }

                    // Change booking status to cancelled instead of deleting
                    booking.status = 'cancelled';
                    booking.paymentStatus = 'failed';
                    await booking.save();
                    console.log(`Booking Cancelled | Unpaid booking ${booking._id} status changed to cancelled`);
                    
                } catch (bookingError) {
                    console.log(`Error processing booking ${booking._id}:`, bookingError);
                }
            }
        } catch (error) {
            console.log('Error in car booking status check:', error);
        }
    });
}

module.exports = scheduleCarStatusCheck;