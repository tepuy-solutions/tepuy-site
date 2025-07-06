/* netlify/functions/createCheckout.js
   Server-side: creates a Stripe Checkout Session */
const stripe = require('stripe')(process.env.STRIPE_SECRET);

exports.handler = async () => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // e.g. price_abc123
          quantity: 1
        }
      ],
      success_url: `${process.env.URL}/thanks.html`,
      cancel_url:  `${process.env.URL}/calculators/property_vs_shares.html`
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: err.toString() };
  }
};
