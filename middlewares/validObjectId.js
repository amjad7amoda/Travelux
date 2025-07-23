const { default: mongoose } = require("mongoose");
const asyncHandler = require("./asyncHandler");
const ApiError = require("../utils/apiError");

module.exports = asyncHandler( async(req, res, next) => {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id))
        return next(new ApiError('The object id is not valid', 400));

    next();
})