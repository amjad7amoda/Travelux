const globalErrorHandler = (err, req, res, next) => {
    // handle mongoose validation error
    if (err.name === 'ValidationError') {
        err.statusCode = 400;
        err.status = 'fail';
        err.message = Object.values(err.errors).map((e) => e.message).join(', ');
    }
    //handle normal error
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error'
    if (process.env.NODE_ENV == 'development')
        return sendErrorForDev(err, res);
    return sendErrorForProd(err, res);
};



const sendErrorForDev = (err, res) => {
    return res.status(err.statusCode).json({
        status: err.status,
        err: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorForProd = (err, res) => {
    return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
};


module.exports = globalErrorHandler;