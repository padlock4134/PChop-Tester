import React, { useState } from 'react';

interface BenchPracticeModalProps {
  open: boolean;
  onClose: () => void;
}

const BenchPracticeModal: React.FC<BenchPracticeModalProps> = ({ open, onClose }) => {
  const [isPracticing, setIsPracticing] = useState(false);

  if (!open) return null;

  const startPractice = () => {
    setIsPracticing(true);
  };

  const endPractice = () => {
    setIsPracticing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-lg border-4 border-amber-900 p-3 sm:p-4 w-full h-full sm:w-3/4 sm:h-auto sm:max-h-[80vh] lg:w-2/3 lg:max-h-[80vh] overflow-y-auto relative flex flex-col lg:flex-row gap-2 sm:gap-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Left Side - Practice Area */}
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-2 text-center text-amber-800">
            {isPracticing ? '🥩 PRACTICING: Knife Skills' : '🥩 The Butcher Block'}
          </h2>
          {isPracticing && (
            <p className="text-center text-xs text-gray-600 mb-2">
              AI-Guided Practice Session • Brunoise Technique
            </p>
          )}
          
          {/* Practice Video/Camera Area */}
          <div className="bg-amber-50 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden border-4 border-amber-700">
            {isPracticing ? (
              // Practice mode - camera would go here
              <div className="text-amber-900 text-center">
                <div className="text-6xl mb-4">🔪</div>
                <p className="text-lg font-bold">Practice Area</p>
                <p className="text-sm opacity-75">Camera feed with AR overlays would appear here</p>
              </div>
            ) : (
              // Not practicing - show placeholder
              <div className="text-amber-900 text-center">
                <div className="text-4xl mb-2">👨‍🍳</div>
                <p className="text-sm font-bold">AI-Guided Practice</p>
                <p className="text-xs opacity-75">Select a lesson and start practicing</p>
              </div>
            )}
            
            {/* Practice Indicator */}
            {isPracticing && (
              <div className="absolute top-4 left-4 bg-amber-700 text-white text-sm px-3 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                PRACTICING
              </div>
            )}
            
            {/* Timer/Progress */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full">
              ⏱️ {isPracticing ? '5:23' : 'Not started'}
            </div>
          </div>

          {/* Simple Controls */}
          <div className="flex justify-center space-x-2 mt-2 mb-12">
            {!isPracticing ? (
              <button 
                onClick={startPractice}
                className="bg-amber-700 text-amber-50 px-4 py-1 text-sm rounded font-bold hover:bg-amber-800 transition-colors border border-amber-900"
              >
                🔪 Start Practice
              </button>
            ) : (
              <button 
                onClick={endPractice}
                className="bg-amber-800 text-white px-4 py-1 text-sm rounded-lg hover:bg-amber-900 transition-colors"
              >
                ⏹️ End Practice
              </button>
            )}
          </div>
          
          {/* Practice Notice */}
          <div className="text-center text-xs text-gray-600 mt-4">
            📹 Practice sessions can be saved for review
          </div>
        </div>
        
        {/* Right Side - Instructions/Feedback */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 pt-6 lg:pt-0 lg:pl-6">
          <h3 className="text-lg font-bold mb-4 text-amber-800">
            📋 Practice Instructions
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Placeholder instructions */}
            <div className="p-3 border-l-4 border-amber-700 bg-amber-50 rounded">
              <div className="font-semibold text-sm text-amber-900 mb-1">Step 1: Setup</div>
              <p className="text-xs text-gray-700">Position your cutting board and gather ingredients</p>
            </div>
            
            <div className="p-3 border-l-4 border-amber-600 bg-amber-50 rounded">
              <div className="font-semibold text-sm text-amber-900 mb-1">Step 2: Knife Grip</div>
              <p className="text-xs text-gray-700">Hold knife with proper pinch grip technique</p>
            </div>
            
            <div className="p-3 border-l-4 border-amber-500 bg-amber-50 rounded">
              <div className="font-semibold text-sm text-amber-900 mb-1">Step 3: First Cuts</div>
              <p className="text-xs text-gray-700">Make 1-2mm slices perpendicular to board</p>
            </div>

            <div className="p-3 border-l-4 border-gray-300 bg-gray-50 rounded opacity-50">
              <div className="font-semibold text-sm text-gray-600 mb-1">Step 4: Validation</div>
              <p className="text-xs text-gray-600">AI will check your cuts for accuracy</p>
            </div>
          </div>
          
          {/* AI Feedback Area */}
          <div className="pt-3 border-t border-gray-200 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-start space-x-2">
                <span className="text-lg">🤖</span>
                <div className="flex-1">
                  <div className="font-semibold text-xs text-blue-900 mb-1">AI Feedback</div>
                  <p className="text-xs text-blue-800">
                    {isPracticing 
                      ? "Great start! Keep your knife angle consistent..."
                      : "Start practicing to receive real-time AI guidance"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchPracticeModal;
