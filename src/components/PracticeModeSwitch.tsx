import React from 'react';

export type PracticeMode = 'ar' | 'vr';

interface PracticeModeSwitchProps {
  value: PracticeMode;
  onChange: (mode: PracticeMode) => void;
  className?: string;
}

const PracticeModeSwitch: React.FC<PracticeModeSwitchProps> = ({ value, onChange, className = '' }) => {
  const isVr = value === 'vr';

  return (
    <div
      className={`relative inline-flex h-10 min-w-[120px] items-center rounded-full border-2 border-amber-900 bg-slate-800 px-1 shadow-inner ${className}`.trim()}
      role="radiogroup"
      aria-label="Practice mode"
    >
      <span
        className={`absolute top-1 h-7 w-[56px] rounded-full transition-all duration-200 ease-out ${
          isVr
            ? 'left-[60px] bg-violet-500 shadow-[0_0_14px_rgba(139,92,246,0.75)]'
            : 'left-1 bg-sky-500 shadow-[0_0_14px_rgba(14,165,233,0.75)]'
        }`}
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={() => onChange('ar')}
        role="radio"
        aria-checked={!isVr}
        className={`relative z-10 flex h-8 w-[56px] items-center justify-center rounded-full text-xs font-bold tracking-wide transition-colors ${
          !isVr ? 'text-white' : 'text-slate-200 hover:text-white'
        }`}
      >
        AR
      </button>

      <button
        type="button"
        onClick={() => onChange('vr')}
        role="radio"
        aria-checked={isVr}
        className={`relative z-10 flex h-8 w-[56px] items-center justify-center rounded-full text-xs font-bold tracking-wide transition-colors ${
          isVr ? 'text-white' : 'text-slate-200 hover:text-white'
        }`}
      >
        VR
      </button>
    </div>
  );
};

export default PracticeModeSwitch;
