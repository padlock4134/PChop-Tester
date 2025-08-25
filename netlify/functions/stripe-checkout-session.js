const { stripe } = require('./lib/stripe-utils');
const { isCsrfValid, setCsrfCookie } = require('./lib/csrf-utils');
const { createErrorResponse, createOkResponseWithBody } = require('./lib/http-utils');
const { getSessionFromCookie, isSessionValid, setSessionCookie } = require('./lib/session-utils');

exports.handler = async function(event) {
  console.log('Received request:', {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    body: event.body ? JSON.parse(event.body) : {}
  });

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Get session from cookie
    const userSession = await getSessionFromCookie(event);
    const { csrfToken } = userSession;

    // Validate API is protected
    if (!isSessionValid(userSession)) {
      console.error('Invalid session');
      return createErrorResponse(401);
    }
    if (!isCsrfValid(event, csrfToken)) {
      console.error('Invalid CSRF token');
      return createErrorResponse(403);
    }

    const touchedSessionCookie = await setSessionCookie(userSession);
    const touchedCsrfCookie = setCsrfCookie(csrfToken);
    const cookiesToSet = [touchedSessionCookie, touchedCsrfCookie];

    const requestBody = JSON.parse(event.body || '{}');
    console.log('Request body:', requestBody);

    // Extract and validate the plan and userId from the request
    const { plan, userId } = requestBody;
    if (!plan || !['yearly', 'monthly'].includes(plan)) {
      const error = 'Invalid or missing plan';
      console.error(error, { plan });
      return createErrorResponse(400, error);
    }
    if (!userId) {
      const error = 'Missing userId';
      console.error(error);
      return createErrorResponse(400, error);
    }

    const priceId = plan === 'yearly'
      ? process.env.STRIPE_PRICE_ID_YEARLY
      : process.env.STRIPE_PRICE_ID_MONTHLY;

    console.log('Using price ID:', priceId, 'for plan:', plan);

    // Grab the Stripe customerId mapped to the userId
    const customers = await stripe.customers.search({ 
      query: `metadata['user_id']:'${userId}'` 
    });
    console.log('Found customers:', customers.data.length);

    if (customers.data.length === 0) {
      const error = `Stripe customer not found for user: [${userId}]`;
      console.error(error);
      return createErrorResponse(404, error);
    }

    const customer = customers.data[0];
    console.log('Using customer:', customer.id);

    // Determine environment
    const isLocal = process.env.NETLIFY_DEV === 'true' || process.env.NODE_ENV === 'development';
    const baseUrl = isLocal ? 'http://localhost:3000' : 'https://porkchop.app';
    const successUrl = `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/dashboard`;

    console.log('Creating checkout session with URLs:', { successUrl, cancelUrl });

    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 3,
        payment_behavior: 'default_incomplete',
      },
      payment_method_collection: 'if_required',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: customer.id,
      metadata: {
        user_id: userId,
      }
    };

    console.log('Session params:', JSON.stringify(sessionParams, null, 2));
    
    const stripeSession = await stripe.checkout.sessions.create(sessionParams);
    console.log('Checkout session created:', stripeSession.id);
    
    return createOkResponseWithBody(JSON.stringify({ 
      checkoutUrl: stripeSession.url 
    }), cookiesToSet, true);

  } catch (err) {
    console.error('Error creating checkout session:', {
      message: err.message,
      stack: err.stack,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
      requestId: err.requestId,
      raw: JSON.stringify(err.raw || {})
    });
    return createErrorResponse(500, 'Failed to create checkout session: ' + err.message);
  }
};
