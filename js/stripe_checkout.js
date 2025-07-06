async function startCheckout() {
  const res = await fetch('/api/createCheckout', { method:'POST' });
  const { sessionId, pubKey } = await res.json();
  const stripe = Stripe(pubKey);
  stripe.redirectToCheckout({ sessionId });
}
