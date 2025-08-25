const { stripe } = require('./lib/stripe-utils');
const { isCsrfValid, setCsrfCookie } = require('./lib/csrf-utils');
const { createErrorResponse, createOkResponseWithBody } = require('./lib/http-utils');
const { getSessionFromCookie, isSessionValid, setSessionCookie } = require('./lib/session-utils');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Get session from cookie
  const session = await getSessionFromCookie(event);
  const { csrfToken } = session;

  // Validate API is protected
  if (!isSessionValid(session)) {
    return createErrorResponse(401);
  }
  if (!isCsrfValid(event, csrfToken)) {
    return createErrorResponse(403);
  }

  const touchedSessionCookie = await setSessionCookie(session);
  const touchedCsrfCookie = setCsrfCookie(csrfToken);
  const cookiesToSet = [touchedSessionCookie, touchedCsrfCookie];

  const requestBody = JSON.parse(event.body || '{}');

  // Extract and validate the plan and userId from the request
  const { plan, userId } = requestBody;
  if (!plan || !['yearly', 'monthly'].includes(plan)) {
    console.error('Invalid or missing plan');
    return createErrorResponse(400, 'Invalid or missing plan');
  }
  if (!userId) {
    console.error('Missing userId');
    return createErrorResponse(400, 'Missing userId');
  }

  const priceId = plan === 'yearly'
    ? process.env.STRIPE_PRICE_ID_YEARLY
    : process.env.STRIPE_PRICE_ID_MONTHLY;

  // Grab the Stripe customerId mapped to the userId
  const customers = await stripe.customers.search({ query: `metadata['user_id']:'${userId}'` });

  // This should never really fail here, but we still do a safety check here.
  if (customers.data.length === 0) {
    throw new Error(`Stripe customer not found for user: [${userId}]`);
  }

  const customer = customers.data[0];

  // Create the Stripe Checkout session URL to redirect the user to
  try {
    const session = await stripe.checkout.sessions.create({
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
        trial_period_days: priceId.includes('monthly') ? 3 : undefined,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
      },
      success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      customer: customer.id,
      metadata: {
        user_id: userId,
      },
    });

    return createOkResponseWithBody(JSON.stringify({ checkoutUrl: session.url }), cookiesToSet, true);
  } catch (err) {
    console.log('Stripe checkout session error: ', err);
    return createErrorResponse(500, err.message || 'Unexpected error');
  }
};
