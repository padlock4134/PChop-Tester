import { netlifyApiClient } from "../client/netlify-api-client";
import { SubscriptionVerification } from "../types/session-types";
import { supabase } from '../api/supabaseClient';  // Corrected path

// Ensures the user has a subscription in Supabase and Stripe.
export async function verifySubscription(userId: string): Promise<SubscriptionVerification> {
  if (!userId) {
    throw new Error('Valid userId not provided');
  }

  try {
    const response = await netlifyApiClient.post('/verify-subscription', { userId });

    // Non-200 response - something went wrong!
    if (response.status !== 200) {
      throw new Error(`Bad response verifying subscription, status=[${response.status}]`);
    }

    // Return the data so onboarding can act accordingly
    return response.data;
  } catch (error) {
    console.error('Subscription verification failed', error);
    throw error;
  }
}

// Get the Stripe checkout URL to send user to.
export async function createStripeCheckoutSession(userId: string, plan: string): Promise<string> {
  if (!userId) {
    throw new Error('Valid userId not provided');
  }
  if (!plan || !['yearly', 'monthly'].includes(plan)) {
    throw new Error('Valid plan not provided');
  }

  try {
    const response = await netlifyApiClient.post('/stripe-checkout-session', { userId, plan });

    // Non-200 response - something went wrong!
    if (response.status !== 200) {
      throw new Error(`Bad response creating checkout session, status=[${response.status}]`);
    }

    // Return the URL
    return response.data.checkoutUrl;
  } catch (error) {
    console.error('Subscription verification failed', error);
    throw error;
  }
}

// Cancel the user's subscription in Stripe and update Supabase
export async function cancelSubscription(userId: string): Promise<{ message: string; subscription: any }> {
  if (!userId) {
    throw new Error('Valid userId not provided');
  }

  try {
    const response = await netlifyApiClient.post('/cancel-subscription', { userId });

    // Non-200 response - something went wrong!
    if (response.status !== 200) {
      throw new Error(`Bad response canceling subscription, status=[${response.status}]`);
    }

    // Return the data with cancellation details
    return response.data;
  } catch (error) {
    console.error('Subscription cancellation failed', error);
    throw error;
  }
}

// Modify your user fetching to include subscription status
async function getUserWithSubscription(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*, user_subscriptions(status)')
    .eq('id', userId)
    .single();
  
  return data;
}
