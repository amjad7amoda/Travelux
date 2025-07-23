const express = require('express');

const router = express.Router();

/**
 * @route   GET /api/server-status
 * @desc    Server status check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is up and running'
    });
});

module.exports = router; 