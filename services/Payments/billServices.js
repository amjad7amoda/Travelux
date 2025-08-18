const asyncHandler = require('../../middlewares/asyncHandler');
const Bill = require('../../models/Payments/billModel');
const ApiError = require('../../utils/apiError');
const FlightTicket = require('../../models/flightTicketModel');
const CarBooking = require('../../models/Cars/carBookingModel');
const Booking = require('../../models/Hotels/hotelBookingModel');
const TrainTripBooking = require('../../models/Trains/trainTripBookingModel');
const Coupon = require('../../models/Payments/couponModel');
const { createNotification } = require('../../services/notificationService')
const TripTicket = require('../../models/trips/tripTicketModel');

// Initialize Stripe with error handling for missing API key
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
    console.warn('Warning: STRIPE_SECRET_KEY environment variable is not set. Stripe functionality will be disabled.');
    stripe = null;
}

const bookingModels = {
    CarBooking,
    Booking,
    FlightTicket,
    TrainTripBooking,
    TripTicket
};

// @desc Add Booking To Bill
// @route POST /api/payments/bill
// @access Private(User)
exports.addProductToBill = asyncHandler(async (req, res, next) => {
    const {bookingId, bookingType} = req.body;
    const user = req.user;

    const BookingModel = bookingModels[bookingType];
    if (!BookingModel) {
        return res.status(400).json({
            status: 'fail',
            message: `This booking is not found`
        });
    }

    let bill = await Bill.findOne({ user: user._id, status: 'continous' });

    if(!bill)
        bill = await Bill.create({ user: user._id, status: 'continous' });

    const item = await BookingModel.findOne({ _id: bookingId, user: user._id, paymentStatus: { $eq: 'pending_payment' } });
    
    if(!item)
        return res.status(400).json({
            status: 'fail',
            message: `This item is not found or it's paid for`
        });

    let billItems = bill.items
    for(const item of billItems){
        if(item.bookingId == bookingId)
            return next(new ApiError(`This booking already in bill`))
    }
    bill.items.push({
        bookingType,
        bookingId
    });
    
    if(bookingType === 'FlightTicket'){
        bill.totalPrice = bill.totalPrice + item.finalPrice;
    }else{
        bill.totalPrice = bill.totalPrice + item.totalPrice;
    }
    
    await bill.save();

    return res.json({
        status: 'success',
        data: {
            bill
        }
    })

});

// @desc Show Bill Info
// @route GET /api/payments/bill
// @access Private(User)
exports.showBillDetails = asyncHandler(
    async(req, res, next) => {
        const user = req.user;
        const status = req.query.status;
        let bill;
        
        if(status === 'completed'){
            bill = await Bill.find({ user: user._id, status: 'completed'});

            for (let singleBill of bill) {
                await singleBill.populate({
                    path: 'items.bookingId',
                    select: '-__v -user',
                    options: { skipUserPopulate: true }
                });

                // Then manually populate nested relations based on booking type
                for (let item of singleBill.items) {
                    if(item.bookingId) {
                        await populateBookingDetails(item);
                    }
                }
                
                // Populate coupons
                await singleBill.populate({
                    path: 'coupons',
                    select: 'code discount expiresAt'
                });
            }

            return res.json({
                status: 'success',
                message: `[${bill.length}] Completed bills fetched successfully`,
                data: {
                    completedBills: bill
                }
            });
        }

        // If status is not 'completed' or not provided, return the continuous bill
        bill = await Bill.findOne({ user: user._id, status: 'continous' }).select('-__v -user');

        if(!bill) {
            return next(new ApiError(`You don't have a bill`));
        }

        // manually populate nested relations based on booking type
        for (let item of bill.items) {
            if(item.bookingId) {
                await populateBookingDetails(item);
            }
        }
        
        //Coupons Check and change totalPriceAfterDiscount
        const billCoupons = bill.coupons;   
        const newCouponCode = req.query.coupon;
        
        if(newCouponCode){
            const newCoupon = await Coupon.findOne({ code: newCouponCode, expiresAt: { $gt: new Date() }});
            if(!newCoupon){
                return next(new ApiError(`Can't find ${newCouponCode} code or it's expired`, 400));
            }
            const exists = billCoupons.some(couponId => couponId.toString() === newCoupon._id.toString());
            if(!exists){
                bill.coupons.push(newCoupon._id);
                await bill.save();
            }
        }
        
        const appliedCoupons = await Coupon.find({
            _id: { $in: bill.coupons },
            expiresAt: { $gt: new Date() }
        });
        
        if(appliedCoupons.length > 0){
            let totalDiscountPercent = 0;
            appliedCoupons.forEach(coupon => {
                totalDiscountPercent += coupon.discount;
            });
            if (totalDiscountPercent > 100) totalDiscountPercent = 100;
            bill.totalPriceAfterDiscount = bill.totalPrice * (1 - totalDiscountPercent / 100);
        }else{
            bill.totalPriceAfterDiscount = bill.totalPrice;
        }
        await bill.save();

        await bill.populate({
            path: 'coupons',
            select: 'code discount expiresAt'
        });

        return res.json({
            status: 'success',
            data: {
                bill
            }
        });
    }
);

exports.showSpecificBill = asyncHandler(async(req, res, next) => {
    const user = req.user;
    const billId = req.params.billId;
    const bill = await Bill.findById(billId);

    if(!bill)
        return next(new ApiError(`Bill not found`));
    
    if(!bill.user.equals(user._id))
        return next(new ApiError(`You don't have permission to show this bill`));
    
    return res.json({
        status: 'success',
        data: {
            bill
        }
    })
})
// @desc Delete a complete bill
// @route DELTE /api/payments/bill/:id
// @access Private(User)
exports.deleteBill = asyncHandler(async(req, res, next) => {
        const user = req.user;
        const billId = req.params.id;
        const bill = await Bill.findById(billId);

        if (!bill)
            return res.status(400).json({
                status: 'fail',
                message: `Bill not found`
            });

        if(!bill.user.equals(user._id))
            return res.status(403).json({
                status: 'fail',
                message: `You don't have permission to delete this bill`
            });

        if(bill.status === 'continous')
            return res.status(400).json({
                status: 'fail',
                message: `You can't delete a continous bill`
            });

        await bill.deleteOne();

        return res.json({
            status: 'success',
            message: `The bill deleted successfully`
        })
})

async function populateBookingDetails(item) {
    let temp;
    switch (item.bookingType) {

        case 'CarBooking':
            temp = await CarBooking.findById(item.bookingId).select('-__v -user -createdAt -updatedAt')
            .populate([{
                path: 'car',
                select: 'brand model year',
            }]);
            item.bookingId = temp;
        break;

        case 'TrainTripBooking':
            temp = await TrainTripBooking.findById(item.bookingId).select('-trainTrip -user -createdAt -updatedAt -estimatedTime')
            .populate([{
                    path: 'startStation',
                    select: 'name city country code'
                }, {
                    path: 'endStation',
                    select: 'name city country code'
                }]);
            item.bookingId = temp;
        break;

        case 'FlightTicket':
            temp = await FlightTicket.findById(item.bookingId).select('-__v -user -createdAt -updatedAt -bookedSeats')
            .populate([{
                path: 'outboundFlight returnFlight',
                select: 'departureAirport',
                options: { skip: true }
            }]);
            item.bookingId = temp;
        break;

        case 'Booking':
            temp = await Booking.findById(item.bookingId).select('-__v -user -createdAt -updatedAt -room')
            .populate({
                    path: 'hotel',
                    select: 'name country city'
                });
            item.bookingId = temp;
        break;
            
        case 'TripTicket': 
            temp = await TripTicket.findById(item.bookingId).select('-__v -user -numberOfPassengers')
            .populate({
                path: 'trip',
                select: 'title country city category events',
                populate: {
                    path: 'events'
                }
            });
            item.bookingId = temp;
        break;
    }
}

// @desc Create a checkout session
// @route POST /api/payments/bill/checkout-session/billId
// @access Private(User)
exports.createCheckoutSession = asyncHandler(async(req, res, next) => {
    // Check if Stripe is properly configured
    if (!stripe) {
        return res.status(500).json({
            status: 'fail',
            message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.'
        });
    }

    const user = req.user;
    const billId = req.params.billId;
    const bill = await Bill.findById(billId);

    if (!bill) {
        return res.status(404).json({
            status: 'fail',
            message: 'No bill found with that ID'
        });
    }

    if(bill.status == 'completed' && bill.paidAt){
        return next(new ApiError(`This bill already paid At ${bill.paidAt}`))
    }

    //Update Total Price After Discount
    let totalPrice = bill.totalPriceAfterDiscount > 0
    ? bill.totalPriceAfterDiscount
    : bill.totalPrice;
    if(bill.totalPriceAfterDiscount === 0){
        bill.totalPriceAfterDiscount = totalPrice;
        await bill.save();
    }
    
    const session = await stripe.checkout.sessions.create({
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: user.firstName + ' ' + user.lastName,
                },
                unit_amount: Math.round(totalPrice * 100),
            },
            quantity: 1,
         }],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/payments/bill`,
        cancel_url: `${req.protocol}://${req.get('host')}/payments/bill`,
        customer_email: user.email,
        client_reference_id: billId,
        metadata: {
            billId
        }
    })
    return res.json({
        status: 'success',
        data: {
            message: 'Checkout session created successfully',
            sessionURL: session.url
        }
    })
})

// @desc Webhook for stripe
// @route POST /webhook-checkout
// @access Public (Stripe webhook)
exports.createWebhook = asyncHandler(async(req, res, next) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig, 
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook verification failed:', err.message);
        return res.status(400).json({
            status: 'fail',
            message: `Webhook verification failed: ${err.message}`
        });
    }

    const {type, data} = event;

    const session = data.object;
    const billId = session.metadata.billId;
    if(type === 'checkout.session.completed') {
        try {
            const bill = await Bill.findById(billId);
            if(!bill) {
                console.error('Bill not found:', billId);
                return res.status(404).json({
                    status: 'fail',
                    message: 'Bill not found'
                });
            }

            // Update bill status to completed
            bill.status = 'completed';
            bill.paidAt = new Date();

            // Set totalPriceAfterDiscount if not already set
            if (!bill.totalPriceAfterDiscount) {
                bill.totalPriceAfterDiscount = bill.totalPrice;
            }
            
            // Update all booking statuses
            for (const item of bill.items) {
                const BookingModel = bookingModels[item.bookingType];
                if (BookingModel) {
                    const booking = await BookingModel.findById(item.bookingId);
                    if (booking) {
                        // Update payment status to paid
                        if (booking.paymentStatus) 
                            booking.paymentStatus = 'paid';
                        
                        // Update booking status based on type
                        if(item.bookingType ===  'CarBooking') 
                                booking.status = 'confirmed';
                            
                        await booking.save();
                    }
                }
            }

            await bill.save();
            createNotification(bill.user, 'Payment Completed', `Your Bill Paid Successfully With Total Price $${bill.totalPriceAfterDiscount}`, 'payment')
            return res.json({
                status: 'success',
                message: 'Payment processed successfully'
            });
        } catch (error) {
            return res.status(500).json({
                status: 'fail',
                message: error.message
            });
        }
    }
    
    // Handle payment failure
    if(type === 'checkout.session.expired' || type === 'payment_intent.payment_failed') {
        console.log('Payment failed for event:', type);
        return res.json({
            status: 'success',
            message: 'Payment failure handled'
        });
    }
    // Return success for other event types
    return res.json({
        status: 'success',
        message: 'Webhook received'
    });
});