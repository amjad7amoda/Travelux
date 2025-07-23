const express = require('express');
const router = express.Router();
const handlerFactory = require('../../services/handlersFactory');
const CarRentalOffice = require('../../models/Cars/carRentalOfficeModel');
const carRentalOfficeService = require('../../services/Cars/carRentalOfficeService');
const { protect, allowTo } = require('../../services/authServices');
const { createOfficeValidator, updateOfficeValidator } = require('../../utils/validators/Cars/officeValidator');
const validObjectId = require('../../middlewares/validObjectId');


router.post('/',
    protect,
    allowTo('officeManager', 'admin'),
    carRentalOfficeService.uploadOfficeCoverImage,
    createOfficeValidator,
    carRentalOfficeService.resizeOfficeCoverImage,
    carRentalOfficeService.createOffice
);

router.get('/', 
    carRentalOfficeService.getAllOffices
);

router.get('/:id',
  validObjectId,
  carRentalOfficeService.getOffice
);

router.get('/my-office',
  protect,
  allowTo('officeManager'),
  carRentalOfficeService.getMyOffice
);

router.put(
  '/:id',
  validObjectId,
  protect,
  allowTo('officeManager', 'admin'),
  carRentalOfficeService.uploadOfficeCoverImage,
  updateOfficeValidator,
  carRentalOfficeService.resizeOfficeCoverImage,
  carRentalOfficeService.updateOffice
);

// router.delete(
//   '/:id',
//   validObjectId,
//   protect,
//   allowTo('officeManager', 'admin'),
//   handlerFactory.DeleteOne(CarRentalOffice)
// );

module.exports = router; 