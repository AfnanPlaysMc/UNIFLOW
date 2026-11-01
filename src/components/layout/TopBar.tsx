import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ChevronLeft, Search, CloudCheck, Cloud, Sun, Moon } from 'lucide-react';

interface TopBarProps {
  onBack: () => void;
  canBack: boolean;
  onOpenSearch: () => void;
  onOpenAccounts?: () => void;
  onOpenSettings?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onBack,
  canBack,
  onOpenSearch,
  onOpenAccounts,
  onOpenSettings,
}) => {
  const { user, isSyncing } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md sticky top-0 z-30 shadow-xs transition-colors">
      {/* Navigation history arrows & Quick Search */}
      <div className="flex items-center gap-3">
        <button
          aria-label="Go back"
          onClick={onBack}
          disabled={!canBack}
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Quick Search trigger on top bar */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-150 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors w-72"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>Search songs, artists, albums...</span>
        </button>
      </div>

      {/* Right controls: theme toggle, cloud sync status & avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Theme Toggle Button (Light White & Blue vs Dark Black & Blue) */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to Light Mode (White & Blue)' : 'Switch to Dark Mode (Black & Blue)'}
          title={isDark ? 'Switch to Light Mode (White & Blue)' : 'Switch to Dark Mode (Black & Blue)'}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-yellow-400 transition-colors shadow-xs"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Sync state */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
          {isSyncing ? (
            <>
              <Cloud className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-spin" />
              <span>Syncing...</span>
            </>
          ) : user ? (
            <>
              <CloudCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline font-medium">Cloud Synced</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="hidden sm:inline font-medium">Local Storage</span>
            </>
          )}
        </div>

        {/* User avatar or sign in button */}
        {user ? (
          <button
            onClick={onOpenAccounts}
            className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-500/30 hover:border-blue-600 transition-all shadow-xs"
            title={user.email || 'Account'}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {user.displayName?.[0] || 'U'}
              </div>
            )}
          </button>
        ) : (
          <button
            onClick={onOpenAccounts}
            className="px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-semibold transition-all hover:bg-blue-100 dark:hover:bg-blue-900"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
