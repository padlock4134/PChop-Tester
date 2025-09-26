import React, { useState } from 'react';
import { createStripeCheckoutSession, cancelSubscription } from '../api/userSubscription';
import ClassRegistrationModal from './ClassRegistrationModal';

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
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [registeredClasses, setRegisteredClasses] = useState<string[]>([]);

  // Class data mapping
  const classData = {
    cul101: { name: 'Knife Skills & Safety', time: 'Monday 9:00 AM - 11:00 AM', location: 'Lab Kitchen A' },
    cul205: { name: 'Seafood Preparation', time: 'Wednesday 1:00 PM - 4:00 PM', location: 'Lab Kitchen B' },
    cul150: { name: 'Pastry Fundamentals', time: 'Friday 10:00 AM - 12:00 PM', location: 'Baking Lab' },
    cul301: { name: 'Advanced Sauce Making', time: 'Tuesday 2:00 PM - 5:00 PM', location: 'Lab Kitchen C' }
  };

  const handleRegistrationComplete = (selectedClasses: string[]) => {
    setRegisteredClasses(prev => [...new Set([...prev, ...selectedClasses])]);
    setRegistrationModalOpen(false);
  };

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
      <div className="bg-white rounded-lg shadow-lg border-4 border-black p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute text-3xl top-2 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Class Schedule & Registration</h2>
        
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
        
        {/* Class Schedule Display */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-maineBlue mb-3">
            {registeredClasses.length > 0 ? 'Your Registered Classes' : 'No Classes Registered'}
          </h3>
          <div className="space-y-2">
            {registeredClasses.length === 0 ? (
              <div className="p-4 bg-gray-100 rounded border border-gray-300 text-center">
                <div className="text-gray-500 italic">Click "Register for Classes" to add classes to your schedule</div>
              </div>
            ) : (
              registeredClasses.map(classId => (
                <div key={classId} className="p-3 bg-sand rounded border border-black">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-maineBlue">{classData[classId]?.name}</div>
                      <div className="text-sm text-gray-600">{classData[classId]?.time} • {classData[classId]?.location}</div>
                    </div>
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Registered
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Registration Actions */}
        {!hasActiveSubscription && (
          <button
            onClick={() => setRegistrationModalOpen(true)}
            disabled={isLoading}
            className={`w-full py-3 rounded bg-seafoam text-maineBlue font-bold text-lg hover:bg-maineBlue hover:text-seafoam transition-colors border border-black ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Register for Classes
          </button>
        )}
        
        {hasActiveSubscription && (
          <button
            onClick={handleCancelSubscription}
            disabled={isLoading}
            className={`w-full py-3 rounded bg-lobsterRed text-weatheredWhite font-bold text-lg hover:bg-red-700 transition-colors border border-black ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Processing...' : 'Drop Classes'}
          </button>
        )}
        
        <p className="mt-4 text-xs text-gray-500 text-center">
          Contact your instructor or academic advisor for schedule changes and enrollment questions.
        </p>
      </div>
      
      {/* Class Registration Modal */}
      <ClassRegistrationModal
        open={registrationModalOpen}
        onClose={() => setRegistrationModalOpen(false)}
        onRegistrationComplete={handleRegistrationComplete}
      />
    </div>
  );
};

export default PaymentModal;
