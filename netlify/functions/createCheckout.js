/*  createCheckout.js – NO-EMAIL version  */
const stripe = require("stripe")(process.env.STRIPE_SECRET);

exports.handler = async () => {
  try {
    /* --- create a one-time payment session --- */
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // 👈 must exist in your Stripe account
          quantity: 1
        }
      ],
      success_url: `${process.env.URL}/thanks.html`,
      cancel_url : `${process.env.URL}/calculators/property_vs_shares.html`
    });

    /* Return the Checkout URL to the browser */
    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };

  } catch (err) {
    /* Log the Stripe error so you can see it in Netlify → Functions → Logs */
    console.error("Stripe error:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Stripe session creation failed" })
    };
  }
};
