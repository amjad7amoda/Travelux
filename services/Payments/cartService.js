const asyncHandler = require('../../middlewares/asyncHandler');
const apiError = require('../../middlewares/apiError');
const Cart = require('../../models/Payments/cartModel');

// @desc Add Booking To Cart
// @route POST /api/payments/cart
// @access Private/User
exports.addProductToCart = asyncHandler(async (req, res, next) => {
    const {bookingId, bookingType} = req.body;
    const user = req.user;
    let cart = await Cart.findOne({ user: user._id });

    if(!cart)
        cart = await Cart.create({ 
            user: user._id,
            bookingId,
            bookingType
        });

});