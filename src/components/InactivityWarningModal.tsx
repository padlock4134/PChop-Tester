import React, { useEffect, useState } from 'react';

interface InactivityWarningModalProps {
  isOpen: boolean;
  countdown: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  countdown,
  onStayLoggedIn,
  onLogout
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-sand border-4 border-maineBlue rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-maineBlue mb-2" style={{ fontFamily: 'Courier New, monospace' }}>
            ⏰ Still There?
          </h2>
          <p className="text-gray-700 mb-4">
            You've been inactive for a while. For your security, you'll be logged out in:
          </p>
          <div className="text-5xl font-bold text-lobsterRed mb-4" style={{ fontFamily: 'Courier New, monospace' }}>
            {timeDisplay}
          </div>
          <p className="text-sm text-gray-600">
            Click "I'm Here" to stay logged in, or you'll be redirected to the login page.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onStayLoggedIn}
            className="bg-maineBlue text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            style={{ fontFamily: 'Courier New, monospace' }}
          >
            ✅ I'm Here!
          </button>
          <button
            onClick={onLogout}
            className="bg-gray-400 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-500 transition-colors"
            style={{ fontFamily: 'Courier New, monospace' }}
          >
            🚪 Log Me Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default InactivityWarningModal;
