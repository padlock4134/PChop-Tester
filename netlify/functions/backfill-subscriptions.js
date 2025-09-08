const { stripe } = require('./lib/stripe-utils');
const { createClient } = require('@supabase/supabase-js');

module.exports.handler = async () => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  
  // Get all users without subscriptions
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email')
    .not('id', 'in', 
      supabase.from('user_subscriptions')
        .select('user_id')
    );

  if (error) throw error;
  
  for (const user of users) {
    // Search Stripe customers by email
    const customers = await stripe.customers.search({
      query: `email:'${user.email}'`
    });

    if (customers.data.length > 0) {
      const customer = customers.data[0];
      
      // Get subscription status
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 1
      });
      
      const status = subscriptions.data.length > 0 
        ? subscriptions.data[0].status
        : 'requires_payment';
      
      // Insert record
      await supabase.from('user_subscriptions').insert({
        user_id: user.id,
        stripe_customer_id: customer.id,
        status: status,
        created_at: new Date().toISOString()
      });
    } else {
      // Create requires_payment record
      await supabase.from('user_subscriptions').insert({
        user_id: user.id,
        status: 'requires_payment',
        created_at: new Date().toISOString()
      });
    }
  }
  
  return {
    statusCode: 200,
    body: `Backfilled ${users.length} users`
  };
};
