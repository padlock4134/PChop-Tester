import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { PlayIcon, PauseIcon, StopIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Timer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isFinished: boolean;
}

interface JobTimerProps {
  teamSize: number;
  setTeamSize: (size: number) => void;
}

const CookingTimer: React.FC<JobTimerProps> = ({ teamSize, setTeamSize }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const discipline = location.pathname.split('/').filter(Boolean)[0] || 'automotive';
  const ct = (key: string) => t(`challenge.disciplineCopy.${discipline}.${key}`, { defaultValue: t(`challenge.${key}`) });
  const [timers, setTimers] = useState<Timer[]>([]);
  const [newTimerMinutes, setNewTimerMinutes] = useState(5);
  const [newTimerLabel, setNewTimerLabel] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Preset timer options
  const presetTimers = [
    { label: 'Oil Change', minutes: 30 },
    { label: 'Brake Inspection', minutes: 45 },
    { label: 'Tire Rotation', minutes: 20 },
    { label: 'Battery Test', minutes: 15 },
    { label: 'Diagnostic Scan', minutes: 60 },
    { label: 'Fluid Check', minutes: 10 }
  ];

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimers(prevTimers => 
        prevTimers.map(timer => {
          if (timer.isRunning && timer.remainingSeconds > 0) {
            const newRemaining = timer.remainingSeconds - 1;
            if (newRemaining === 0) {
              // Timer finished - play sound
              playFinishSound();
              return { ...timer, remainingSeconds: 0, isRunning: false, isFinished: true };
            }
            return { ...timer, remainingSeconds: newRemaining };
          }
          return timer;
        })
      );
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const playFinishSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const calculateAdjustedTime = (baseMinutes: number) => {
    // Simple scaling: more techs = slightly more time
    const scaleFactor = Math.sqrt(teamSize / 2); // Square root scaling for service time
    return Math.round(baseMinutes * scaleFactor);
  };

  const addTimer = (minutes: number, label: string) => {
    const adjustedMinutes = calculateAdjustedTime(minutes);
    const newTimer: Timer = {
      id: Date.now().toString(),
      label: `${label} (${teamSize} techs)`,
      totalSeconds: adjustedMinutes * 60,
      remainingSeconds: adjustedMinutes * 60,
      isRunning: false,
      isFinished: false,
    };
    setTimers(prev => [...prev, newTimer]);
    setNewTimerLabel('');
  };

  const toggleTimer = (id: string) => {
    setTimers(prev => 
      prev.map(timer => 
        timer.id === id 
          ? { ...timer, isRunning: !timer.isRunning, isFinished: false }
          : timer
      )
    );
  };

  const resetTimer = (id: string) => {
    setTimers(prev => 
      prev.map(timer => 
        timer.id === id 
          ? { ...timer, remainingSeconds: timer.totalSeconds, isRunning: false, isFinished: false }
          : timer
      )
    );
  };

  const removeTimer = (id: string) => {
    setTimers(prev => prev.filter(timer => timer.id !== id));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Serving Size Input */}
      <div className="bg-sand p-4 rounded-lg border border-black">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700">
            Bay Team:
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max="8"
              value={teamSize}
              onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center font-bold"
            />
            <span className="text-sm text-gray-600">techs</span>
          </div>
        </div>
        
        {/* Visual representation */}
        <div className="flex items-center space-x-1 mb-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                i < teamSize 
                  ? 'bg-maineBlue text-seafoam' 
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              🚗
            </div>
          ))}
        </div>
        
        <div className="text-xs text-gray-500">
          *1 tech represents one learner assigned to the service bay.
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Time recommendations scale by bay team size for realistic shop pacing.
        </div>
      </div>

      <div className="bg-sand p-4 rounded-lg border border-black">
        <h4 className="text-sm font-semibold mb-2 text-gray-700">{t('cookingTimer.title')}: </h4>
        <div className="flex flex-wrap gap-2">
          {presetTimers.map((preset, index) => (
            <button
              key={index}
              onClick={() => addTimer(preset.minutes, preset.label)}
              className="px-3 py-1 bg-seafoam text-maineBlue rounded-full text-xs font-medium hover:bg-maineBlue hover:text-seafoam transition-colors"
            >
              {preset.label} ({calculateAdjustedTime(preset.minutes)}m)
            </button>
          ))}
        </div>
      </div>
      </div>

      {/* Active Timers */}
      <div className="space-y-3">
        {timers.map(timer => (
          <div
            key={timer.id}
            className={`p-4 rounded-lg border-2 ${
              timer.isFinished 
                ? 'bg-red-100 border-red-400' 
                : timer.isRunning 
                  ? 'bg-green-100 border-green-400' 
                  : 'bg-white border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-maineBlue">{timer.label}</div>
                <div className={`text-2xl font-mono ${timer.isFinished ? 'text-red-600' : 'text-gray-800'}`}>
                  {formatTime(timer.remainingSeconds)}
                  {timer.isFinished && <span className="text-sm ml-2 text-red-600 font-bold">{ct('completed').toUpperCase()}!</span>}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => toggleTimer(timer.id)}
                  className={`p-2 rounded ${
                    timer.isRunning 
                      ? 'bg-yellow-500 hover:bg-yellow-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white transition-colors`}
                  disabled={timer.remainingSeconds === 0}
                >
                  {timer.isRunning ? (
                    <PauseIcon className="w-4 h-4" />
                  ) : (
                    <PlayIcon className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => resetTimer(timer.id)}
                  className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  <StopIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeTimer(timer.id)}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default CookingTimer;
