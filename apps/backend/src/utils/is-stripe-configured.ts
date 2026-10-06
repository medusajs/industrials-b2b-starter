export function isStripeConfigured(): boolean {
  const apiKey = process.env.STRIPE_API_KEY;
  return !!apiKey;
}
