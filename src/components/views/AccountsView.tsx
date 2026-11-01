import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { User, LogIn, LogOut, CloudCheck, RefreshCw, ShieldCheck, Database, Music, Heart } from 'lucide-react';

export const AccountsView: React.FC = () => {
  const { user, login, logout, isSyncing } = useAuth();
  const { favorites, playlists, refreshLibrary } = useLibrary();
  const [manualSyncing, setManualSyncing] = useState(false);

  const handleManualSync = async () => {
    setManualSyncing(true);
    await refreshLibrary();
    setTimeout(() => setManualSyncing(false), 800);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-32">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Account & Cloud Persistence
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Secure Google Authentication and persistent Cloud Firestore database backup
        </p>
      </div>

      {/* Account Card */}
      <div className="bg-white dark:bg-[#0B0F19] rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
        {user ? (
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-16 h-16 rounded-full border-2 border-blue-500 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Authenticated via Google
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user.displayName || 'Vibeo Member'}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">UID: {user.uid.slice(0, 16)}...</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-800 text-xs font-bold transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sign in to Vibeo</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                Authenticate with Google to permanently store your playlists, favorites, and custom audio profiles in your secure Cloud Firestore database.
              </p>
            </div>
            <button
              onClick={login}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/30 transition-all inline-flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Continue with Google
            </button>
          </div>
        )}

        {/* Database Persistence Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
              <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Cloud Storage</span>
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white">Cloud Firestore</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <CloudCheck className="w-3.5 h-3.5" /> Permanent Online Sync
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
              <Heart className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Saved Tracks</span>
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white">{favorites.length} Songs</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Local & Cloud Replicated</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
              <Music className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Playlists</span>
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white">{playlists.length} Custom Collections</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Synced across sessions</p>
          </div>
        </div>

        {/* Manual sync trigger */}
        <div className="pt-2 flex items-center justify-end text-xs text-slate-500 dark:text-slate-400">
          <button
            onClick={handleManualSync}
            disabled={manualSyncing || isSyncing}
            className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${manualSyncing || isSyncing ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
        </div>
      </div>
    </div>
  );
};
