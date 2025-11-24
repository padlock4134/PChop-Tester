import React, { useState } from 'react';

interface BenchPracticeModalProps {
  open: boolean;
  onClose: () => void;
}

const BenchPracticeModal: React.FC<BenchPracticeModalProps> = ({ open, onClose }) => {
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'real' | 'virtual' | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string>('');

  if (!open) return null;

  const startRealPractice = () => {
    setPracticeMode('real');
    setIsPracticing(true);
  };

  const startVirtualPractice = () => {
    setPracticeMode('virtual');
    setIsPracticing(true);
  };

  const endPractice = () => {
    setIsPracticing(false);
    setPracticeMode(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-lg border-4 border-black overflow-hidden w-full h-full sm:w-3/4 sm:h-auto sm:max-h-[80vh] lg:w-2/3 lg:max-h-[80vh] relative flex flex-col lg:flex-row">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-amber-800 hover:text-amber-900 text-2xl z-10"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Left Side - Practice Area with Banner */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Banner Header - Left Side Only */}
          <div className="p-4 bg-amber-100 text-amber-800 font-retro text-center">
            <h2 className="text-xl flex items-center justify-center">
              <span className="text-2xl mr-2">🧀</span>
              Your Charcuterie Board
            </h2>
          </div>
          
          {/* Practice Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {isPracticing && (
            <>
              <h2 className="text-lg font-bold mb-2 text-center text-amber-800">
                {practiceMode === 'real' ? '🎥 REAL PRACTICE' : '📚 VIRTUAL PRACTICE'}: Knife Skills
              </h2>
              <p className="text-center text-xs text-gray-600 mb-2">
                {practiceMode === 'real' 
                  ? 'AI-Guided Practice Session • Brunoise Technique'
                  : 'Interactive Walkthrough • Brunoise Technique'}
              </p>
            </>
          )}
          
          {/* Practice Video/Camera Area */}
          <div className="bg-amber-50 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden border-4 border-maineBlue">
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
              <>
                <button 
                  onClick={startRealPractice}
                  className="bg-amber-700 text-amber-50 px-6 py-2 text-sm rounded font-bold hover:bg-amber-800 transition-colors border border-amber-900"
                >
                  🎥 Real Practice
                </button>
                <button 
                  onClick={startVirtualPractice}
                  className="bg-amber-600 text-amber-50 px-6 py-2 text-sm rounded font-bold hover:bg-amber-700 transition-colors border border-amber-900"
                >
                  📚 Virtual Practice
                </button>
              </>
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
        </div>
        
        {/* Right Side - Instructions/Feedback */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col overflow-hidden">
          {/* Colored Header for Right Side */}
          <div className="p-4 bg-amber-100 text-amber-800 font-retro text-center">
            <h3 className="text-lg font-bold">
              📋 Practice Instructions
            </h3>
          </div>
          
          {/* Instructions Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          
          {/* Lesson Selection Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-amber-800 mb-2">
              Select Lesson to Practice:
            </label>
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className="w-full px-3 py-2 border-2 border-amber-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Choose a lesson...</option>
              <optgroup label="Term 1: Culinary Foundations">
                <option value="lesson-1-1">Kitchen Safety and Sanitation</option>
                <option value="lesson-1-2">Food Handling and Storage</option>
                <option value="lesson-1-3">Introduction to Kitchen Equipment</option>
                <option value="lesson-1-4">Basic Cooking Terminology</option>
                <option value="lesson-1-5">Weights, Measures, and Conversions</option>
              </optgroup>
              <optgroup label="Term 1: Knife Skills">
                <option value="lesson-2-1">Knife Safety and Maintenance</option>
                <option value="lesson-2-2">Basic Knife Cuts</option>
                <option value="lesson-2-3">Vegetable Fabrication</option>
                <option value="lesson-2-4">Meat and Fish Fabrication</option>
              </optgroup>
              <optgroup label="Term 2: Breakfast & Garde Manger">
                <option value="lesson-3-1">Egg Cookery</option>
                <option value="lesson-3-2">Breakfast Preparations</option>
                <option value="lesson-3-3">Cold Food Preparation</option>
                <option value="lesson-3-4">Salads and Dressings</option>
              </optgroup>
              <optgroup label="Term 2: Baking & Pastry">
                <option value="lesson-4-1">Basic Dough and Batters</option>
                <option value="lesson-4-2">Quick Breads and Muffins</option>
                <option value="lesson-4-3">Yeast Breads</option>
                <option value="lesson-4-4">Basic Pastry and Desserts</option>
              </optgroup>
            </select>
          </div>
          
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
    </div>
  );
};

export default BenchPracticeModal;
