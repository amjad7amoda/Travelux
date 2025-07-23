const express = require('express')
const router = express.Router();
const { allowTo, protect } = require('../../services/authServices');
const { getAllTrains, getTrain, createTrain, updateTrain } = require('../../services/Trains/trainServices');
const { createTrainValidator, updateTrainValidator } = require('../../utils/validators/Trains/trainValidator');
const validObjectId = require('../../middlewares/validObjectId');

router.get('/', getAllTrains);

router.get('/:id',
    validObjectId,
    getTrain
);

router.post('/',
    protect, allowTo('admin'),
    createTrainValidator,
    createTrain
);

router.put('/:id',
    protect, allowTo('admin'),
    validObjectId,
    updateTrainValidator,
    updateTrain
);

module.exports = router;
