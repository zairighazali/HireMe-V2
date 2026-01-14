import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export { stripePromise };

export async function createPaymentIntent(amount, currency = 'myr') {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/create-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await getAuthToken()}`,
    },
    body: JSON.stringify({ amount, currency }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return response.json();
}

export async function confirmPayment(clientSecret, paymentMethod) {
  const stripe = await stripePromise;
  return stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethod,
  });
}

async function getAuthToken() {
  const { auth } = await import('../../firebase');
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}