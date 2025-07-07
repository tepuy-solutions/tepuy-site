const stripe = require("stripe")(process.env.STRIPE_SECRET);
const fetch = require("node-fetch");

exports.handler = async (event) => {
  const sig = event.headers["stripe-signature"];
  const rawBody = event.rawBody || event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return { statusCode: 400, body: `Webhook error: ${err.message}` };
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const { email } = stripeEvent.data.object.metadata;

    const accessLink = `${process.env.URL}/pro.html?code=${process.env.ACCESS_SECRET_CODE}`;

    // Replace with your mail provider (example: Mailgun, SendGrid)
    await fetch("https://api.mailgun.net/v3/YOUR_DOMAIN/messages", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from("api:" + process.env.MAILGUN_API_KEY).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        from: "Tepuy Solutions <noreply@YOUR_DOMAIN>",
        to: email,
        subject: "Your Pro Access Link",
        text: `Thanks for your purchase! Click here to access Pro features:\n\n${accessLink}`
      })
    });
  }

  return { statusCode: 200, body: "ok" };
};
