const { stripe } = require('./lib/stripe-utils');
const { getSupabase } = require('./lib/supabase-utils');
const { isCsrfValid, setCsrfCookie } = require('./lib/csrf-utils');
const { createErrorResponse, createOkResponseWithBody } = require('./lib/http-utils');
const { getSessionFromCookie, isSessionValid, setSessionCookie } = require('./lib/session-utils');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  // Get session from cookie
  const session = await getSessionFromCookie(event);
  const { csrfToken } = session;

  // Validate API is protected
  if (!isSessionValid(session)) {
    return createErrorResponse(401, 'Unauthorized');
  }
  if (!isCsrfValid(event, csrfToken)) {
    return createErrorResponse(403);
  }

  const touchedSessionCookie = await setSessionCookie(session);
  const touchedCsrfCookie = setCsrfCookie(csrfToken);
  const cookiesToSet = [touchedSessionCookie, touchedCsrfCookie];

  try {
    const { userId } = JSON.parse(event.body || '{}');
    if (!userId) {
      return createErrorResponse(400, 'Missing userId.');
    }

    const supabase = getSupabase(session.supabaseToken);

    // Get the user's subscription from Supabase
    const { data: subscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (fetchError || !subscription) {
      console.error('No active subscription found:', fetchError);
      return createErrorResponse(404, 'No active subscription found.');
    }

    // Cancel the subscription in Stripe
    const stripeSubscriptionId = subscription.stripe_subscription_id;
    await stripe.subscriptions.cancel(stripeSubscriptionId);

    // Update the subscription status in Supabase
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', stripeSubscriptionId);

    if (updateError) {
      console.error('Failed to update subscription status:', updateError);
      return createErrorResponse(500, 'Failed to update subscription status.');
    }

    // Send notification email to admin (keeping this part from the original)
    // This could be moved to a separate function or webhook for better separation of concerns
    // For now, we'll keep it simple and inline
    
    return createOkResponseWithBody(JSON.stringify({ 
      message: 'Subscription canceled successfully.',
      subscription: { ...subscription, status: 'canceled' }
    }), cookiesToSet, true);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return createErrorResponse(500, `Unexpected error: ${error.message}`);
  }
};
