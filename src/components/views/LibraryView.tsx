import React, { useState } from 'react';
import { Playlist } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { useAudio } from '../../context/AudioContext';
import { useAuth } from '../../context/AuthContext';
import { TrackItem } from '../ui/TrackItem';
import { PlaylistCard } from '../ui/PlaylistCard';
import {
  Heart,
  ListMusic,
  History,
  Plus,
  Play,
  CloudCheck,
  Cloud,
  Trash2,
  Database,
  ArrowRight,
} from 'lucide-react';
import { navigateToHash } from '../../utils/router';

interface LibraryViewProps {
  onSelectPlaylist: (playlist: Playlist) => void;
}

type LibraryTab = 'playlists' | 'favorites' | 'history';

export const LibraryView: React.FC<LibraryViewProps> = ({ onSelectPlaylist }) => {
  const { favorites, playlists, history, createPlaylist, clearHistory } = useLibrary();
  const { playTrack } = useAudio();
  const { user, isSyncing } = useAuth();

  const [activeTab, setActiveTab] = useState<LibraryTab>('playlists');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const pl = await createPlaylist(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
    if (onSelectPlaylist) {
      onSelectPlaylist(pl);
    } else {
      navigateToHash('playlist', pl.id);
    }
  };

  const handlePlayFavorites = () => {
    if (favorites.length > 0) {
      playTrack(favorites[0], favorites);
    }
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Header & Cloud Sync State */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Your Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Playlists, liked tracks, and listening history backed by IndexedDB and Cloud Firestore
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Cloud Sync Status Indicator */}
          <button
            onClick={() => navigateToHash('accounts')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-xs"
            title="View Cloud Firestore & Account Sync"
          >
            {isSyncing ? (
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                <Cloud className="w-3.5 h-3.5 animate-pulse" /> Syncing...
              </span>
            ) : user ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CloudCheck className="w-3.5 h-3.5" /> Cloud Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Account & Cloud
                <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              </span>
            )}
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Playlist
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'playlists'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          Playlists ({playlists.length})
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'favorites'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Heart className="w-4 h-4" />
          Liked Songs ({favorites.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          History ({history.length})
        </button>
      </div>

      {/* Tab: Playlists */}
      {activeTab === 'playlists' && (
        <div>
          {playlists.length === 0 ? (
            <div className="py-20 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
              <ListMusic className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Create your first playlist</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Organize your favorite songs and mixes into custom collections.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25"
              >
                Create Playlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {playlists.map((pl) => (
                <PlaylistCard
                  key={pl.id}
                  playlist={pl}
                  onSelect={(p) => {
                    if (onSelectPlaylist) onSelectPlaylist(p);
                    else navigateToHash('playlist', p.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Favorites */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {favorites.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {favorites.length} saved {favorites.length === 1 ? 'song' : 'songs'}
              </span>
              <button
                onClick={handlePlayFavorites}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Play All
              </button>
            </div>
          )}

          {favorites.length === 0 ? (
            <div className="py-20 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No liked songs yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tap the heart icon on any song to save it to your personal favorites.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {favorites.map((t, idx) => (
                <TrackItem
                  key={t.id}
                  track={t}
                  index={idx}
                  playlistContext={favorites}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {history.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Recently played tracks
              </span>
              <button
                onClick={clearHistory}
                className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            </div>
          )}

          {history.length === 0 ? (
            <div className="py-20 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Listening history is clean</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tracks you play will be recorded here for quick replay.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((h, idx) => (
                <TrackItem
                  key={h.historyId}
                  track={h.track}
                  index={idx}
                  playlistContext={history.map((x) => x.track)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleCreatePlaylist}
            className="w-full max-w-md bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Playlist</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Playlist Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Focus Mix, Night Drive"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description (optional)</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Give your playlist a vibe or notes..."
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25"
              >
                Create Playlist
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
