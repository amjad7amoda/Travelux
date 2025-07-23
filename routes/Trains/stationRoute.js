const { Router } = require('express');
const { createStation, getStation, getAllStations, updateStation, deleteStation, getCities } = require('../../services/Trains/stationServices');
const { protect, allowTo } = require('../../services/authServices');
const { createStationValidator, updateStationValidator } = require ('../../utils/validators/Trains/stationValidator');
const validObjectId = require('../../middlewares/validObjectId');
const router = Router();

router.get('/getCities',
    getCities
);

router.post('/', protect, allowTo('admin'), createStationValidator, createStation);




router.get('/:id',
    validObjectId,
    getStation);

router.get('/', getAllStations);


router.put('/:id',
    protect, allowTo('admin'),
    validObjectId,
    updateStationValidator,
    updateStation);
    

module.exports = router;