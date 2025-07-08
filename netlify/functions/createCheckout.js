console.log("⚡ Function createCheckout.js invoked");

const stripeKey = process.env.STRIPE_SECRET;
const priceId = process.env.STRIPE_PRICE_ID;
const siteUrl = process.env.PUBLIC_SITE_URL;

console.log("🔑 Stripe key begins with:", stripeKey?.slice(0, 6));
console.log("💲 Price ID:", priceId);
console.log("🌐 Site URL:", siteUrl);

const stripe = require("stripe")(stripeKey);

exports.handler = async () => {
  console.log("🚀 Attempting to create Stripe checkout session…");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${siteUrl}/thanks.html?code=tepuy2025`,
      cancel_url: `${siteUrl}/calculators/property_vs_shares.html`
    });

    console.log("✅ Session created:", session.url);

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };

  } catch (err) {
    console.error("❌ Stripe error:", err.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Unknown error" })
    };
  }
};
