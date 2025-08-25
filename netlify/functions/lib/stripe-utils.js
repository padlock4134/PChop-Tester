const Stripe = require('stripe');

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_ID_MONTHLY',
  'STRIPE_PRICE_ID_YEARLY'
];

// Check for missing environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Initialize Stripe with error handling
let stripe;
try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    timeout: 10000, // 10 second timeout
    maxNetworkRetries: 2
  });
  
  // Test the Stripe connection
  (async () => {
    try {
      await stripe.customers.list({ limit: 1 });
      console.log('Stripe connection successful');
    } catch (err) {
      console.error('Stripe connection test failed:', err.message);
    }
  })();
  
} catch (err) {
  console.error('Failed to initialize Stripe:', err.message);
  throw err; // Re-throw to prevent the app from starting with a bad Stripe config
}

// Helper function to handle Stripe errors
function handleStripeError(err) {
  console.error('Stripe Error:', {
    message: err.message,
    type: err.type,
    code: err.code,
    statusCode: err.statusCode,
    requestId: err.requestId,
    stack: err.stack
  });
  throw err; // Re-throw to be handled by the calling function
}

module.exports = {
  stripe,
  handleStripeError
};
