// Function that verifies if the current user
const { stripe } = require('./lib/stripe-utils');
const { getSupabase } = require('./lib/supabase-utils');
const { isCsrfValid, setCsrfCookie } = require('./lib/csrf-utils');
const { createErrorResponse, createOkResponseWithBody } = require('./lib/http-utils');
const { getSessionFromCookie, isSessionValid, setSessionCookie } = require('./lib/session-utils');

exports.handler = async function(event) {
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

  const requestBody = JSON.parse(event.body || '{}');

  // Extract and validate the Supabase userId from the response
  const { userId } = requestBody;
  if (!userId) {
    console.error('No userId found in the request body');
    return createErrorResponse(400, 'No userId found in the request body.');
  }

  const supabase = getSupabase(session.supabaseToken);

  try {
    // First check if subscription already exists in Supabase
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .single();

    console.log('Existing subscription check:', { userId, existingSub });

    // If it exists, simply return it.
    if (existingSub) {
      console.log('Found existing subscription, returning isPaid: true');
      // Convert trial_end back to Unix timestamp for frontend
      const subscription = {
        ...existingSub,
        trial_end: existingSub.trial_end ? Math.floor(new Date(existingSub.trial_end).getTime() / 1000) : null
      };
      return createOkResponseWithBody(JSON.stringify({ isPaid: true, subscription }), cookiesToSet, true);
    }

    // If subscription is not in Supabase, then check if both customer and subscription are in Stripe.
    const customers = await stripe.customers.search({ query: `metadata['user_id']:'${userId}'` });

    // If customer is not in Stripe, then they gotta give dat money!!
    if (customers.data.length === 0) {
      // We create the customer now so that we can set metadata since the Checkout Page can't do it.
      await stripe.customers.create({
        email: session.email,
        metadata: {
          user_id: userId,
          external_user_id: session.userId,
          external_tenant_id: session.tenantId
        }
      });

      // Once created, proceed to show the user the Payment Modal so the subscription can be created.
      console.warn(`Stripe customer created for user: [${userId}], but subscription still required.`);
      return createOkResponseWithBody(JSON.stringify({ isPaid: false, subscription: null }), cookiesToSet, true);
    }

    const customer = customers.data[0];

    // If Stripe customer exists, lookup their subscriptions.
    const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: 'all' });

    // If subscription is not in Stripe, then they gotta give dat money!!
    if (subscriptions.data.length === 0) {
      console.warn(`No Stripe subscription found for user: [${userId}]`);
      return createOkResponseWithBody(JSON.stringify({ isPaid: false, subscription: null }), cookiesToSet, true);
    }

    const subscription = subscriptions.data[0];

    // Update or create subscription record in Supabase
    const { data: existingSubscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_customer_id', customer.id)
      .maybeSingle();

    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      plan: subscription.plan?.id?.includes('yearly') ? 'yearly' : 'monthly',
      status: subscription.status,
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    };

    console.log('Upserting subscription data:', JSON.stringify(subscriptionData, null, 2));

    let subscriptionResult;
    if (existingSubscription) {
      // Update existing subscription
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('user_subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id)
        .select();
      
      if (updateError) throw updateError;
      subscriptionResult = updatedSubscription[0];
    } else {
      // Insert new subscription
      const { data: newSubscription, error: insertError } = await supabase
        .from('user_subscriptions')
        .insert([subscriptionData])
        .select();
      
      if (insertError) throw insertError;
      subscriptionResult = newSubscription[0];
    }

    console.log('Subscription upsert successful:', JSON.stringify(subscriptionResult, null, 2));

    // Check if subscription is active or in trial
    console.log('Subscription status check:', {
      status: subscription.status,
      trial_end: subscription.trial_end,
      current_period_end: subscription.current_period_end
    });
    
    const isPaid = subscription.status === 'active' || 
                  subscription.status === 'trialing';
                  
    console.log('Final isPaid result:', isPaid);

    // Return the subscription status
    const responseBody = JSON.stringify({
      isPaid,
      subscription: {
        ...subscriptionResult,
        trial_end: subscription.trial_end
      }
    });
    
    console.log('Sending response:', responseBody);

    return createOkResponseWithBody(responseBody, cookiesToSet, true);
  } catch (err) {
    console.error('Error verifying subscription:', err);
    return createErrorResponse(500, `Unexpected error: ${err.message}`);
  }
};
