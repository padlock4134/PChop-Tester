import React, { useState } from 'react';
import { createStripeCheckoutSession, cancelSubscription } from '../api/userSubscription';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  plan: 'monthly' | 'yearly';
  userId: string;
  hasActiveSubscription?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ open, onClose, plan, userId, hasActiveSubscription = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleStripeCheckout = async (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Redirect to the checkout link based on the selected plan
      const checkoutUrl = await createStripeCheckoutSession(userId, plan);
      window.location.href = checkoutUrl;
    } catch (err) {
      setError('Failed to create checkout session. Please try again.');
      console.error('Checkout error:', err);
      setIsLoading(false);
    }
  };

  // Cancel Subscription handler
  const handleCancelSubscription = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const result = await cancelSubscription(userId);
      setSuccessMessage(result.message || 'Subscription canceled successfully.');
      // You might want to update the UI or redirect the user after successful cancellation
      setTimeout(() => {
        onClose();
        // Optionally refresh the page or update the UI to reflect the canceled status
        window.location.reload();
      }, 3000);
    } catch (err) {
      setError('Failed to cancel subscription. Please try again or contact support.');
      console.error('Cancellation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute text-3xl top-2 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Complete Your Subscription</h2>
        
        {/* Display success message or error if any */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
        
        {/* Pricing display */}
        <div className="mb-6 text-center">
          <p className="text-xl font-bold text-maineBlue">
            {plan === 'yearly' ? '$99.00' : '$10.99'}
            <span className="text-base font-normal text-gray-600">/{plan === 'yearly' ? 'year' : 'month'} USD</span>
          </p>
          {plan === 'yearly' && (
            <p className="text-sm text-green-600 mt-1">Save over 24% with annual billing</p>
          )}
        </div>
        
        {/* Show Subscribe button only if no active subscription */}
        {!hasActiveSubscription && (
          <button
            onClick={handleStripeCheckout}
            disabled={isLoading}
            className={`w-full py-3 rounded bg-seafoam text-maineBlue font-bold text-lg hover:bg-maineBlue hover:text-seafoam transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Processing...' : 'Subscribe'}
          </button>
        )}
        
        {/* Show Cancel Subscription button only if has active subscription */}
        {hasActiveSubscription && (
          <button
            onClick={handleCancelSubscription}
            disabled={isLoading}
            className={`w-full py-3 rounded bg-lobsterRed text-weatheredWhite font-bold text-lg hover:bg-red-700 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Processing...' : 'Cancel Subscription'}
          </button>
        )}
        
        <p className="mt-4 text-xs text-gray-500 text-center">
          Payments are securely processed by Stripe. You'll be redirected to your dashboard after payment.
        </p>
      </div>
    </div>
  );
};

export default PaymentModal;
