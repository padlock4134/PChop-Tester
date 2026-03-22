import React, { useState } from 'react';

const ShopFreddieWidget = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="fixed bottom-6 right-6 bg-maineBlue text-seafoam rounded-full w-16 h-16 flex items-center justify-center shadow-lg z-50 hover:bg-seafoam hover:text-maineBlue transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-label="Open Shop Freddie AI Assistant"
      >
        <span className="text-3xl">❄️</span>
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 bg-white border border-maineBlue rounded shadow-lg p-4 w-80 z-50">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-maineBlue">Shop Freddie</span>
            <button onClick={() => setOpen(false)} className="text-gray-500">✕</button>
          </div>
          <div className="text-gray-700 mb-2">Hi! I'm Shop Freddie. Ask me anything about HVAC systems, heating, or cooling!</div>
          <input className="w-full border rounded p-2" placeholder="Type your question..." />
        </div>
      )}
    </>
  );
};

export default ShopFreddieWidget;

