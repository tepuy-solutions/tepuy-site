const stripe = require("stripe")(process.env.STRIPE_SECRET);

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body || "{}");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1
      }
    ],
    metadata: { email },
    success_url: `${process.env.URL}/thanks.html`,
    cancel_url:  `${process.env.URL}/calculators/property_vs_shares.html`
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ url: session.url })
  };
};
