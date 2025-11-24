import React from 'react';

interface BenchPracticeModalProps {
  open: boolean;
  onClose: () => void;
}

const BenchPracticeModal: React.FC<BenchPracticeModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-lg border-4 border-black p-3 sm:p-4 w-full h-full sm:w-3/4 sm:h-auto sm:max-h-[80vh] lg:w-2/3 lg:max-h-[80vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
        >
          ✕
        </button>

        <div className="text-center py-8">
          <div className="text-6xl mb-4">🥩</div>
          <h2 className="text-3xl font-bold mb-4 text-maineBlue font-retro">
            The Butcher Block
          </h2>
          <p className="text-gray-600">
            AI-powered practice sessions coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default BenchPracticeModal;
