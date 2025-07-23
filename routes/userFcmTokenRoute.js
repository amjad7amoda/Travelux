const express = require('express');
const router = express.Router();
const { saveFcmToken } = require('../services/userFcmToken');
const { protect } = require('../services/authServices');

router.post('/', protect, saveFcmToken);

module.exports = router;
