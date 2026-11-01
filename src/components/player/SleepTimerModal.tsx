import React, { useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import { Moon, X } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({ isOpen = true, onClose }) => {
  const { sleepTimerRemaining, startSleepTimer, cancelSleepTimer } = useAudio();
  const [customMin, setCustomMin] = useState('20');

  if (!isOpen) return null;

  const presets = [5, 15, 30, 45, 60];

  const handleSelect = (mins: number) => {
    startSleepTimer(mins);
    onClose();
  };

  const handleCustom = () => {
    const parsed = parseInt(customMin, 10);
    if (!isNaN(parsed) && parsed > 0) {
      startSleepTimer(parsed);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-sm bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative text-slate-900 dark:text-white transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Sleep Timer</h3>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sleepTimerRemaining !== null && (
          <div className="my-4 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Timer Active</p>
              <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {Math.floor(sleepTimerRemaining / 60)}m {sleepTimerRemaining % 60}s remaining
              </p>
            </div>
            <button
              onClick={() => {
                cancelSleepTimer();
                onClose();
              }}
              className="text-xs px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg font-semibold transition-colors shadow-xs"
            >
              Turn Off
            </button>
          </div>
        )}

        <div className="space-y-2 my-4">
          {presets.map((mins) => (
            <button
              key={mins}
              onClick={() => handleSelect(mins)}
              className="w-full text-left px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 transition-all flex items-center justify-between"
            >
              <span>{mins} minutes</span>
            </button>
          ))}
        </div>

        {/* Custom duration */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="300"
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            className="w-20 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white text-center font-mono font-semibold focus:outline-none focus:border-blue-600"
            aria-label="Custom minutes"
          />
          <button
            onClick={handleCustom}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Set Custom Minutes
          </button>
        </div>
      </div>
    </div>
  );
};
