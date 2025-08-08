const express = require('express');
const router = express.Router();
const billServices = require('../../services/Payments/billServices')
const { protect, allowTo} = require('../../services/authServices')

router.use(protect, allowTo('user'))

router.route('/')
.post(billServices.addProductToBill)
.get(billServices.showBillDetails);

router.get('/checkout-session/:billId', billServices.createCheckoutSession);

router.route('/:id')
.delete(billServices.deleteBill)



const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.get('/test-stripe', async (req, res) => {
    try {
        const balance = await stripe.balance.retrieve();
        res.json({ success: true, balance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/webhook', billServices.createWebhook);

module.exports = router;