import React, { useState, useRef, useEffect } from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';

const tips = [
  "Review the full work order before starting.",
  "Measure twice and verify specs before making cuts or installs.",
  "Use the right tool for the job to improve safety and quality.",
  "Stage your materials in order of operations.",
  "Lock out power/energy sources before hands-on work.",
  "Document each major step so handoffs are easier.",
  "Keep your work area clean to prevent rework and accidents.",
  "Check tolerances early to catch fit issues before final assembly.",
  "Inspect and test your work before sign-off.",
  "If something feels off, pause and troubleshoot before proceeding."
  // ...add up to 365 tips
];

function getTipOfTheDay() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return tips[dayOfYear % tips.length];
}

const TipOfTheDay = () => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative flex items-center">
      <button
        aria-label="Show tip of the day"
        className="p-2 rounded-full bg-seafoam hover:bg-maineBlue hover:text-seafoam text-maineBlue shadow transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <LightBulbIcon className="h-7 w-7" />
      </button>
      {open && (
        <div
          ref={popoverRef}
          className="absolute left-1/2 -translate-x-1/2 top-12 z-50 bg-weatheredWhite text-maineBlue rounded-lg shadow-lg px-5 py-4 font-retro text-sm max-w-xs w-64 border border-seafoam"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">Tip of the Day</span>
            <button
              aria-label="Close tip"
              className="text-lobsterRed text-lg font-bold ml-2"
              onClick={() => setOpen(false)}
            >✕</button>
          </div>
          <span>{getTipOfTheDay()}</span>
        </div>
      )}
    </div>
  );
};

export default TipOfTheDay;

