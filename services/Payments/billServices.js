const asyncHandler = require('../../middlewares/asyncHandler');
const apiError = require('../../middlewares/globalErrorHandler');
const Bill = require('../../models/Payments/billModel');
const ApiError = require('../../utils/apiError');
const FlightTicket = require('../../models/flightTicketModel');
const CarBooking = require('../../models/Cars/carBookingModel');
const HotelBooking = require('../../models/Hotels/hotelBookingModel');
const TrainTripBooking = require('../../models/Trains/trainTripBookingModel');


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