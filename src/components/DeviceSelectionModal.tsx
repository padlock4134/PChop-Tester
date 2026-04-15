import React from 'react';

interface DeviceSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelectAR: () => void;
  onSelectVR: () => void;
}

const DeviceSelectionModal: React.FC<DeviceSelectionModalProps> = ({
  open,
  onClose,
  onSelectAR,
  onSelectVR,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl border-4 border-maineBlue bg-sand shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-maineBlue/30 px-4 py-3">
          <h3 className="font-retro text-xl text-maineBlue">Choose Your Device</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl font-bold leading-none text-maineBlue hover:text-lobsterRed"
            aria-label="Close device selection"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          <button
            type="button"
            onClick={onSelectAR}
            className="w-full rounded-lg border-2 border-maineBlue bg-white px-4 py-3 text-left text-maineBlue transition-colors hover:bg-maineBlue hover:text-white"
          >
            <div className="font-bold">📱 Use AR on this device</div>
            <div className="text-xs opacity-80">Use your current camera-based practice view.</div>
          </button>

          <button
            type="button"
            onClick={onSelectVR}
            className="w-full rounded-lg border-2 border-maineBlue bg-white px-4 py-3 text-left text-maineBlue transition-colors hover:bg-maineBlue hover:text-white"
          >
            <div className="font-bold">🥽 Use VR headset</div>
            <div className="text-xs opacity-80">Try immersive headset mode, then fallback if unavailable.</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceSelectionModal;
