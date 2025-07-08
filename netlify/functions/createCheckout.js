/*  createCheckout.js – NO-EMAIL version  */

console.log("⚡ createCheckout.js invoked");

const stripeKey = process.env.STRIPE_SECRET;
const priceId = process.env.STRIPE_PRICE_ID;
const siteUrl = process.env.PUBLIC_SITE_URL;

console.log("🔑 stripeKey begins with:", stripeKey?.slice(0, 6));
console.log("💲 priceId is:", priceId);
console.log("🌍 siteUrl is:", siteUrl);
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
      success_url: `${process.env.PUBLIC_SITE_URL}/thanks.html?code=tepuy2025`,
      cancel_url : `${process.env.PUBLIC_SITE_URL}/calculators/property_vs_shares.html`
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
