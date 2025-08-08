const asyncHandler = require('../../middlewares/asyncHandler');
const apiError = require('../../middlewares/globalErrorHandler');
const Bill = require('../../models/Payments/billModel');
const ApiError = require('../../utils/apiError');
const FlightTicket = require('../../models/flightTicketModel');
const CarBooking = require('../../models/Cars/carBookingModel');
const HotelBooking = require('../../models/Hotels/hotelBookingModel');
const TrainTripBooking = require('../../models/Trains/trainTripBookingModel');
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
    HotelBooking,
    FlightTicket,
    TrainTripBooking
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

    const item = await BookingModel.findById(bookingId);
    if(!item)
        return res.status(400).json({
            status: 'fail',
            message: `This item is not found`
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
    bill.totalPrice = bill.totalPrice + item.totalPrice;
    
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
        const status = req.query.status || 'continous';
        const bill = await Bill.findOne({ user: user._id, status: status });

        if(!bill)
            return next(new ApiError(`You don't have a bill`));

        // First populate the bookingId using refPath
        await bill.populate({
                path: 'items.bookingId',
                select: '-__v -user'
        });

        // Then manually populate nested relations based on booking type
        for (let item of bill.items) 
            if(item.bookingId)
                populateBookingDetails(item);
        

        return res.json({
            status: 'success',
            data: {
                bill
            }
        })
    }
)

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
    switch (item.bookingType) {
        case 'CarBooking':
            await item.bookingId.populate([
                {
                    path: 'car',
                    select: 'brand model year',
                }
            ]);
            break;
        case 'TrainTripBooking':
            await item.bookingId.populate([
                {
                    path: 'trainTrip',
                    select: '-__v -user -stations'
                },
                {
                    path: 'startStation',
                    select: 'name city country code'
                },
                {
                    path: 'endStation',
                    select: 'name city country code'
                }
            ]);
            break;
        case 'FlightTicket':
            await item.bookingId.populate([
                {
                    path: 'flight',
                    select: '-__v -user'
                }
            ]);
            break;
        case 'HotelBooking':
            await item.bookingId.populate([
                {
                    path: 'hotel',
                    select: '-__v -user'
                }
            ]);
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

    const totalPrice = bill.totalPrice;

    const session = await stripe.checkout.sessions.create({
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: user.firstName + ' ' + user.lastName,
                },
                unit_amount: totalPrice * 100,
            },
            quantity: 1,
         }],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/payments/bill`,
        cancel_url: `${req.protocol}://${req.get('host')}/payments/bill`,
        customer_email: user.email,
        client_reference_id: billId,
        metadata: {
            billId,
            totalPrice
        }
    })

    return res.json({
        status: 'success',
        data: {
            message: 'Checkout session created successfully',
            session
        }
    })
})

// @desc Webhook for stripe
// @route POST /api/payments/bill/webhook
// @access Private(User)
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
        return res.status(400).json({
            status: 'fail',
            message: `Webhook verification failed: ${err.message}`
        });
    }


    const {type, data} = event;
    if(type === 'checkout.session.completed') {
        const session = data.object;
        const billId = session.metadata.billId;
        const bill = await Bill.findById(billId);
        if(!bill) {
            return res.status(404).json({
                status: 'fail',
                message: 'Bill not found'
            });
        }
        console.log(bill);
    }

})