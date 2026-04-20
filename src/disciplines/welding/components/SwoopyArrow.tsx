import React from 'react';

const SwoopyArrow = () => {
  return (
    <div className="relative w-full flex justify-center py-2">
      <div className="flex items-center">
        <svg 
          className="w-6 h-6 text-red-500 transform -rotate-90 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M14 5l7 7m0 0l-7 7m7-7H3" 
          />
        </svg>
        <span className="text-sm text-red-500">Click PorkChop To Go Back</span>
      </div>
    </div>
  );
};

export default SwoopyArrow;

