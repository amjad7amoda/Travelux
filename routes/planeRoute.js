const express = require('express');
const {
    getPlanesByAirline,
    checkPlaneOwnership,
    getPlane,
    createPlane,
    updatePlane,
    deletePlane,
    setAirlineIdToBody,
    changePlaneStatus
} = require('../services/planeService');
const {protect, allowTo} = require('../services/authServices');
const {getPlaneValidator,createPlaneValidator} = require('../utils/validators/planeValidator');

const router = express.Router();


router.route('/myPlanes').get(protect,allowTo('airlineOwner'),getPlanesByAirline);

router.route('/:id').get(protect,allowTo('airlineOwner'),getPlaneValidator,checkPlaneOwnership,getPlane)
                    .put(protect,allowTo('airlineOwner'),checkPlaneOwnership,updatePlane)
                    .delete(protect,allowTo('airlineOwner'),checkPlaneOwnership,deletePlane);

router.route('/').post(protect,allowTo('airlineOwner'),setAirlineIdToBody,createPlaneValidator,createPlane);

router.route('/:id/status').put(protect,allowTo('airlineOwner'),checkPlaneOwnership,changePlaneStatus);

module.exports = router;
