import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import {
  Home,
  Search,
  Library,
  Plus,
  Settings,
  Heart,
  LogIn,
  ListMusic,
  User,
} from 'lucide-react';

interface SidebarProps {
  currentPath?: string;
  currentView?: string;
  onNavigate: (path: string, param?: any) => void;
  onOpenCreatePlaylist: () => void;
}

const APP_LOGO = 'https://raw.githubusercontent.com/AfnanPlaysMc/GAME/main/Black%20and%20White%20Simple%20Modern%20Bold%20Minimalist%20%20Logo.png';
const OXA_LOGO = 'https://raw.githubusercontent.com/AfnanPlaysMc/GAME/main/Black%20Beige%20Minimalist%20Typographic%20Creative%20Studio%20Logo.png';

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  currentView,
  onNavigate,
  onOpenCreatePlaylist,
}) => {
  const activePath = currentPath || currentView || 'home';
  const { user, login } = useAuth();
  const { playlists, favorites } = useLibrary();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'yourlibrary', label: 'Your Library', icon: Library },
    { id: 'accounts', label: 'Account & Cloud', icon: User },
  ];

  return (
    <aside className="w-72 bg-white dark:bg-[#0B0F19] border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col h-full shrink-0 select-none shadow-xs transition-colors">
      {/* Brand Header */}
      <div
        onClick={() => onNavigate('home')}
        className="p-6 flex items-center gap-3.5 cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-900 shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform shrink-0 border border-slate-200 dark:border-slate-700">
          <img src={APP_LOGO} alt="Vibeo Logo" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            Vibeo
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 inline-block">
              <img src={OXA_LOGO} alt="OXA Studios" className="w-full h-full object-cover" />
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wider uppercase truncate">OXA STUDIOS</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="px-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-base font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Playlists Section */}
      <div className="flex-1 overflow-y-auto px-4 mt-8 space-y-2">
        <div className="flex items-center justify-between px-3 pb-1 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <span>Your Playlists</span>
          <button
            onClick={onOpenCreatePlaylist}
            title="Create Playlist"
            className="p-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Liked songs quick entry */}
        <button
          onClick={() => onNavigate('yourlibrary')}
          className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <span className="truncate">Liked Songs</span>
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-mono font-bold">{favorites.length}</span>
        </button>

        {/* User Playlists list */}
        {playlists.map((pl) => (
          <button
            key={pl.id}
            onClick={() => onNavigate('playlist', pl)}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left truncate"
          >
            <ListMusic className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate">{pl.title}</span>
          </button>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
            activePath === 'settings'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
          }`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span>Settings</span>
        </button>

        {/* Profile Card / Login Button */}
        {user ? (
          <div
            onClick={() => onNavigate('accounts')}
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-9 h-9 rounded-full border border-blue-500/40" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {user.displayName?.[0] || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.displayName || 'Vibeo User'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={login}
            className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2.5"
          >
            <LogIn className="w-4 h-4" /> Sign In with Google
          </button>
        )}
      </div>
    </aside>
  );
};
