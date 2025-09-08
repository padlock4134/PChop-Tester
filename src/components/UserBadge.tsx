// Add to your user profile component
const SubscriptionBadge = ({ status }) => {
  if (status === 'trialing') {
    return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Trial</span>;
  }
  if (status === 'active') {
    return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Pro</span>;
  }
  return null;
};

// Usage in user profile:
<SubscriptionBadge status={user.subscriptionStatus} />
