/*  createCheckout.js  –  Netlify function  */
const stripe = require('stripe')(process.env.STRIPE_SECRET);

exports.handler = async (event) => {
  /* ── safely parse body (may be empty) ── */
  let email = null;
  if (event.body && event.body.trim() !== '') {
    try {
      const data = JSON.parse(event.body);
      email = data.email || null;
    } catch { /* ignore parse error */ }
  }

  /* ── build Stripe Checkout params ── */
  const params = {
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,   // 1× fixed-price product
        quantity: 1
      }
    ],
    success_url: `${process.env.URL}/thanks.html`,
    cancel_url : `${process.env.URL}/calculators/property_vs_shares.html`
  };

  /* only pass email if we actually have one */
  if (email) params.customer_email = email;

  /* ── create session ── */
  const session = await stripe.checkout.sessions.create(params);

  return {
    statusCode: 200,
    body: JSON.stringify({ url: session.url })
  };
};
