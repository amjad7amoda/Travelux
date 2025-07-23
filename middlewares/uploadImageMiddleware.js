const multer = require('multer');
const ApiError = require('../utils/apiError');

const multerOptions = () => {

    const multerStorage = multer.memoryStorage();

    const multerFilter = function (req, file, cb) {
        if (file.mimetype.startsWith('image')) {
            cb(null, true);
        } else {
            cb(new ApiError('Only Images allowed', 400), false);
        }
    };

    const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

    return upload;
};

exports.uploadSingleImage = (fieldName) => multerOptions().single(fieldName);

exports.uploadMultiImages = (arrayOfFields) =>
    multerOptions().fields(arrayOfFields);


// *************** Old Code, Not Working ***************

// const multer = require('multer')
// const ApiError = require('../utils/apiError');
// const asyncHandler = require('./asyncHandler');

// exports.uploadSingleImage =(fieldName) => {
//         const multerStorage = multer.memoryStorage();

//         const multerFilter = (req, file, cb) => {
//             if(file.mimetype.startsWith('image'))
//                 cb(null, true);
//             else cb(new ApiError('Only images is allowed', 400));
//         };

//         const upload = multer({ storage: multerStorage, fileFilter: multerFilter});
//         return upload.single(fieldName);
// }


// exports.uploadMultiImages = (...arrayOfFields) => {
//         const multerStorage = multer.memoryStorage();

//         const multerFilter = (req, file, cb) => {
//             if(file.mimetype.startsWith('image'))
//                 cb(null, true);
//             else
//                 cb(new ApiError('Files must be only images', 400));
//         }

//         const upload = multer({ storage: multerStorage, fileFilter: multerFilter })
//         return upload.fields(arrayOfFields);
// }
