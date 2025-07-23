const express = require('express');
const router = express.Router();
const { allowTo, protect} = require('../../services/authServices');
const { createRoute, updateRoute, getRoute, getAllRoutes, isRouteManager, getManagerRoutes } = require('../../services/Trains/routeServices');
const { createRouteValidator, updateRouteValidator } = require('../../utils/validators/Trains/routeValidator')
const validObjectId = require('../../middlewares/validObjectId');

router.get('/managerRoutes',
    protect,
    allowTo('admin', 'routeManager'),
    getManagerRoutes);

router.get('/', 
    getAllRoutes
);

router.post('/', 
    protect, 
    allowTo('admin', 'routeManager'), 
    createRouteValidator,
    createRoute
);

router.get('/:id', 
    validObjectId,
    getRoute
);

router.put('/:id', 
    protect, 
    allowTo('admin', 'routeManager'),
    validObjectId,
    isRouteManager,
    updateRouteValidator,
    updateRoute
);

module.exports = router;