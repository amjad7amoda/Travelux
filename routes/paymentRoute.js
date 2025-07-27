const express = require('express');
const router = express.Router();
const { createCheckoutSession } = require('../services/paymentService');
const asyncHandler = require('../middlewares/asyncHandler');

router.post('/create-checkout-session', asyncHandler(
    async (req, res) => {
        const { items } = req.body;
        const session = await createCheckoutSession(
            items, 
            'http://https://56.228.31.247:4000/success', 
            'http://https://56.228.31.247:4000/cancel');
        res.json({ status: 'success', data: { url: session.url } });
    }
));

module.exports = router;