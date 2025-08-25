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
    apiVersion: '2024-06-20', // Updated to a more recent version
    timeout: 10000, // 10 second timeout
    maxNetworkRetries: 2
  });
  
  // Test the Stripe connection
  (async () => {
    try {
      await stripe.customers.list({ limit: 1 });
      console.log('Stripe connection successful');
    } catch (err) {
      console.error('Stripe connection test failed:', err);
    }
  })();
} catch (err) {
  console.error('Failed to initialize Stripe:', err);
  throw err;
}

// Helper function to handle Stripe errors
const handleStripeError = (err) => {
  console.error('Stripe error:', err);
  throw new Error(err.message || 'Payment processing failed');
};

module.exports = {
  stripe,
  handleStripeError
};
