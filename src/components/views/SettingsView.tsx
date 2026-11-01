import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { useAudio } from '../../context/AudioContext';
import { useTheme } from '../../context/ThemeContext';
import { localDB } from '../../database/indexed-db';
import {
  User,
  LogIn,
  LogOut,
  Volume2,
  Download,
  Upload,
  Trash2,
  Shield,
  Check,
  ArrowRight,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';
import { navigateToHash } from '../../utils/router';

const OXA_LOGO = 'https://raw.githubusercontent.com/AfnanPlaysMc/GAME/main/Black%20Beige%20Minimalist%20Typographic%20Creative%20Studio%20Logo.png';

export const SettingsView: React.FC = () => {
  const { user, login, logout } = useAuth();
  const { clearHistory, favorites, playlists } = useLibrary();
  const { theme, isDark, setTheme } = useTheme();

  const [crossfade, setCrossfade] = useState(() => {
    return Number(localStorage.getItem('waveform_crossfade') || 0);
  });
  const [audioQuality, setAudioQuality] = useState(() => {
    return localStorage.getItem('waveform_quality') || 'auto';
  });
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  const handleCrossfadeChange = (val: number) => {
    setCrossfade(val);
    localStorage.setItem('waveform_crossfade', String(val));
  };

  const handleQualityChange = (val: string) => {
    setAudioQuality(val);
    localStorage.setItem('waveform_quality', val);
  };

  const handleExportLibrary = () => {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      favorites,
      playlists,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibeo-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerCopied('Library exported successfully');
  };

  const handleImportLibrary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json.favorites)) {
          for (const fav of json.favorites) {
            await localDB.saveFavorite(fav);
          }
        }
        if (Array.isArray(json.playlists)) {
          for (const pl of json.playlists) {
            await localDB.savePlaylist(pl);
          }
        }
        triggerCopied('Library imported! Refreshing...');
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        triggerCopied('Error parsing JSON library file');
      }
    };
    reader.readAsText(file);
  };

  const handleClearSearches = () => {
    localStorage.removeItem('waveform_recent_searches');
    triggerCopied('Search history cleared');
  };

  const triggerCopied = (msg: string) => {
    setCopiedStatus(msg);
    setTimeout(() => setCopiedStatus(null), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 transition-colors">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Theme preferences, account sync, and local storage management
        </p>
      </div>

      {copiedStatus && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          {copiedStatus}
        </div>
      )}

      {/* APPEARANCE & THEME SECTION (White & Blue vs Black & Blue) */}
      <section className="p-6 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Appearance & Theme</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Choose your color scheme: Light (White & Blue) or Dark (Black & Blue)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Light Mode Option */}
          <button
            onClick={() => setTheme('light')}
            className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-4 ${
              theme === 'light'
                ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Light Mode</p>
                  <p className="text-[11px] text-slate-500">White and Vibrant Blue</p>
                </div>
              </div>
              {theme === 'light' && (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Visual Color Swatches */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                <span className="w-4 h-4 rounded-full bg-[#F8FAFC] border border-slate-300 shadow-xs inline-block" />
                <span>#F8FAFC (White)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 ml-auto">
                <span className="w-4 h-4 rounded-full bg-[#2563EB] shadow-xs inline-block" />
                <span>#2563EB (Blue)</span>
              </div>
            </div>
          </button>

          {/* Dark Mode Option */}
          <button
            onClick={() => setTheme('dark')}
            className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-4 ${
              theme === 'dark'
                ? 'border-blue-500 bg-[#060913] shadow-md ring-2 ring-blue-500/30'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-slate-400'}`} />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Black and Vibrant Blue</p>
                </div>
              </div>
              {theme === 'dark' && (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Visual Color Swatches */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                <span className="w-4 h-4 rounded-full bg-[#060913] border border-slate-700 shadow-xs inline-block" />
                <span>#060913 (Black)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 ml-auto">
                <span className="w-4 h-4 rounded-full bg-[#3B82F6] shadow-xs inline-block" />
                <span>#3B82F6 (Blue)</span>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Account / Google Firebase Auth Section */}
      <section className="p-6 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Account & Cloud Persistence</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Google Authentication with Cloud Firestore</p>
            </div>
          </div>

          <button
            onClick={() => navigateToHash('accounts')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            Manage Accounts <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-12 h-12 rounded-full border border-blue-400"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{user.displayName || 'Vibeo Member'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Cloud Firestore Active
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all flex items-center gap-2 self-start sm:self-center"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Signed in as Guest (Offline Mode)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your library is saved in local IndexedDB. Sign in with Google to backup & sync across devices!
              </p>
            </div>
            <button
              onClick={login}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs shrink-0"
            >
              <LogIn className="w-4 h-4" /> Sign In with Google
            </button>
          </div>
        )}
      </section>

      {/* Playback Configuration */}
      <section className="p-6 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Audio & Playback</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Audio stream fidelity and crossfade settings</p>
          </div>
        </div>

        {/* Audio Quality */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Audio Quality</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bitrate and stream compression profile</p>
          </div>
          <select
            value={audioQuality}
            onChange={(e) => handleQualityChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="auto">Auto (Adaptive)</option>
            <option value="high">High Fidelity (320 kbps)</option>
            <option value="normal">Data Saver (128 kbps)</option>
          </select>
        </div>

        {/* Crossfade */}
        <div className="py-2 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Crossfade Tracks</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Overlap duration between consecutive audio tracks</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{crossfade}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={crossfade}
            onChange={(e) => handleCrossfadeChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </section>

      {/* Library Data & Storage Management */}
      <section className="p-6 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Storage & Privacy</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage offline IndexedDB data and backups</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleExportLibrary}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-all flex items-center gap-3"
          >
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Export Library</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Download playlists and favorites as JSON</p>
            </div>
          </button>

          <label className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-all flex items-center gap-3 cursor-pointer">
            <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Import Library</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Restore playlists from JSON backup</p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImportLibrary}
              className="hidden"
            />
          </label>

          <button
            onClick={clearHistory}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950 border border-slate-200 dark:border-slate-800 text-left transition-all flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400"
          >
            <Trash2 className="w-5 h-5 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs font-bold">Clear Listening History</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Purges recently played tracks</p>
            </div>
          </button>

          <button
            onClick={handleClearSearches}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950 border border-slate-200 dark:border-slate-800 text-left transition-all flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400"
          >
            <Trash2 className="w-5 h-5 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs font-bold">Clear Search History</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Purges recent search tags</p>
            </div>
          </button>
        </div>
      </section>

      {/* About & Studio Attributions */}
      <section className="p-6 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700 shrink-0">
              <img src={OXA_LOGO} alt="OXA Studios Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Vibeo by OXA STUDIOS</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Professional Music Studio Platform v1.0.0</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-xs font-bold">
            OXA Studios
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Vibeo is a clean, modern music platform built with React, Web Audio API, IndexedDB, Firebase Firestore, and decentralized streaming. All metadata and streams are powered by public, permanent, zero-cost legal endpoints:
        </p>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li><strong className="text-slate-800 dark:text-slate-200">Decentralized Artist Network:</strong> Full-length decentralized artist streaming</li>
          <li><strong className="text-slate-800 dark:text-slate-200">Wikipedia REST API:</strong> Official artist biographies and encyclopedia entries</li>
          <li><strong className="text-slate-800 dark:text-slate-200">Deezer & Audius APIs:</strong> Global charts and rich metadata</li>
          <li><strong className="text-slate-800 dark:text-slate-200">LRCLIB API:</strong> Synchronized community lyrics</li>
          <li><strong className="text-slate-800 dark:text-slate-200">Firebase Firestore:</strong> Cloud persistence attached to your Google project</li>
        </ul>
      </section>
    </div>
  );
};
