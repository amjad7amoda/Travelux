const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createCheckoutSession = async (items, successUrl, cancelUrl) => {
    return await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: items,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl
    })
}

