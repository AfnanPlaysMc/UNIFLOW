import React from 'react';
import { Home, Search, Library, Settings, Play, Pause, User } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

interface MobileNavProps {
  currentPath?: string;
  currentView?: string;
  onNavigate: (path: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPath, currentView, onNavigate }) => {
  const activePath = currentPath || currentView || 'home';
  const { currentTrack, isPlaying, togglePlay, setIsFullScreen } = useAudio();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-lg transition-colors">
      {/* Mobile Mini Player if track is loaded */}
      {currentTrack && (
        <div
          onClick={() => setIsFullScreen(true)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={currentTrack.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
              alt={currentTrack.title}
              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentTrack.title}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          <button
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>
      )}

      {/* Bottom Bar Icons */}
      <nav className="flex items-center justify-around py-2.5">
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activePath === 'home'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        <button
          onClick={() => onNavigate('search')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activePath === 'search'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">Search</span>
        </button>

        <button
          onClick={() => onNavigate('yourlibrary')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activePath === 'yourlibrary'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px] font-medium">Library</span>
        </button>

        <button
          onClick={() => onNavigate('accounts')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activePath === 'accounts'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Account</span>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activePath === 'settings'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </nav>
    </div>
  );
};
