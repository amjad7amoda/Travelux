const express = require('express');
const router = express.Router();
const billServices = require('../../services/Payments/billServices')
const { protect, allowTo} = require('../../services/authServices')

router.use(protect, allowTo('user'))

router.route('/')
.post(billServices.addProductToBill)
.get(billServices.showBillDetails);

router.route('/:id')
.delete(billServices.deleteBill)

module.exports = router;