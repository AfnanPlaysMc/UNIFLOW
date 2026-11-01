import React, { useState, useEffect, useRef } from 'react';
import { Playlist, Track } from '../../types';
import { useAudio } from '../../context/AudioContext';
import { useLibrary } from '../../context/LibraryContext';
import { TrackItem } from '../ui/TrackItem';
import {
  Play,
  Shuffle,
  Trash2,
  ListMusic,
  Clock,
  Music,
  Plus,
  Search as SearchIcon,
  X,
  Check,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { searchTracksUnified, getRecommendedTracksForAdd } from '../../services/searchHelper';

interface PlaylistViewProps {
  playlist?: Playlist | null | string;
  playlistId?: string;
  onDeleted?: () => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlist: initialPlaylist,
  playlistId,
  onDeleted,
}) => {
  const { playTrack } = useAudio();
  const { playlists, deletePlaylist, removeTrackFromPlaylist, addTrackToPlaylist } = useLibrary();

  // Dialog and modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add music search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Resolve ID from route param or initial playlist (which could be string or object)
  const targetId =
    playlistId ||
    (typeof initialPlaylist === 'string' ? initialPlaylist : initialPlaylist?.id) ||
    '';

  // Always resolve the freshest playlist from LibraryContext so track updates reflect immediately!
  const playlist =
    playlists.find((p) => p.id === targetId) ||
    (typeof initialPlaylist === 'object' && initialPlaylist && initialPlaylist.id === targetId
      ? initialPlaylist
      : null);

  // Load recommended tracks when Add Music modal is opened
  useEffect(() => {
    if (showAddModal && recommendedTracks.length === 0) {
      getRecommendedTracksForAdd(15).then((tracks) => {
        setRecommendedTracks(tracks);
      });
    }
  }, [showAddModal, recommendedTracks.length]);

  // Debounced search inside Add Music modal
  useEffect(() => {
    if (!showAddModal) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const term = searchQuery.trim();
    if (!term) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchTracksUnified(term, 20);
        setSearchResults(results);
      } catch (err) {
        console.warn('Error searching tracks for playlist:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, showAddModal]);

  const handlePlayAll = () => {
    if (playlist && Array.isArray(playlist.tracks) && playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const handleShuffle = () => {
    if (playlist && Array.isArray(playlist.tracks) && playlist.tracks.length > 0) {
      const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  const handleConfirmDelete = async () => {
    if (!playlist) return;
    setIsDeleting(true);
    try {
      await deletePlaylist(playlist.id);
      setShowDeleteConfirm(false);
      onDeleted?.();
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddTrack = async (track: Track) => {
    if (!playlist) return;
    await addTrackToPlaylist(playlist.id, track);
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!playlist) return;
    await removeTrackFromPlaylist(playlist.id, trackId);
  };

  if (!playlist) {
    return (
      <div className="py-20 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-xs max-w-xl mx-auto mt-10">
        <ListMusic className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Playlist Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          This playlist may have been removed or the link is invalid.
        </p>
        <button
          onClick={() => onDeleted?.()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const tracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
  const firstCover = playlist.coverUrl || (tracks.length > 0 ? tracks[0].artwork : '');
  const totalSecs = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const trackIdSet = new Set(tracks.map((t) => t.id));

  return (
    <div className="space-y-8 pb-32">
      {/* Clean White/Blue & Black/Blue Playlist Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-50/70 via-white to-slate-50 dark:from-blue-950/40 dark:via-[#0B0F19] dark:to-[#060913] border border-slate-200/90 dark:border-slate-800 shadow-sm transition-colors">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md shrink-0 flex items-center justify-center">
          {firstCover ? (
            <img src={firstCover} alt={playlist.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <ListMusic className="w-16 h-16 mb-2 text-blue-500 dark:text-blue-400" />
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">No cover yet</span>
            </div>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Personal Playlist
          </span>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {playlist.title}
          </h1>

          {playlist.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300">{playlist.description}</p>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1 font-mono">
            <span className="flex items-center gap-1">
              <Music className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
            </span>
            {totalSecs > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                {Math.floor(totalSecs / 60)} min {totalSecs % 60} sec
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3">
            <button
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              Play All
            </button>

            <button
              onClick={handleShuffle}
              disabled={tracks.length === 0}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-xs"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Songs
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-300 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shadow-xs"
              title="Delete Playlist"
              aria-label="Delete Playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Tracks List */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tracks</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{tracks.length} tracks</span>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add More
            </button>
          </div>
        </div>

        {tracks.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xs">
            <ListMusic className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800 dark:text-white">This playlist is empty</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Find songs and add them to build your custom playlist.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-1.5 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Search & Add Songs
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {tracks.map((t, idx) => (
              <div key={`${t.id}_${idx}`} className="group relative">
                <TrackItem
                  track={t}
                  index={idx}
                  playlistContext={tracks}
                />
                <button
                  aria-label={`Remove ${t.title} from playlist`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTrack(t.id);
                  }}
                  className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                  title="Remove from playlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Playlist</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900 dark:text-white">"{playlist.title}"</strong>? All {tracks.length} track associations will be removed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/25 flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Playlist
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MUSIC MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Songs to "{playlist.title}"
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Search millions of songs or choose from trending picks
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="relative">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search song title, artist (e.g. No Love, Shubh, Daft Punk)..."
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Results / Recommendations Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {isSearching ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                  <span className="text-xs font-medium">Searching music...</span>
                </div>
              ) : searchQuery.trim() ? (
                /* Search Results */
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Search Results ({searchResults.length})
                  </h4>
                  {searchResults.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                      <Music className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No tracks found for "{searchQuery}"</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Try searching with a shorter artist or track name.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {searchResults.map((t) => {
                        const isAdded = trackIdSet.has(t.id);
                        return (
                          <div
                            key={t.id}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={t.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                                alt={t.title}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                  {t.title}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {t.artist}
                                  {t.album && t.album !== t.title && ` • ${t.album}`}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddTrack(t)}
                              disabled={isAdded}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                                isAdded
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-default'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 active:scale-95'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Added
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  Add
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Recommended Tracks When Not Searching */
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Popular & Recommended Tracks
                    </h4>
                  </div>

                  <div className="space-y-1.5">
                    {recommendedTracks.map((t) => {
                      const isAdded = trackIdSet.has(t.id);
                      return (
                        <div
                          key={t.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={t.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                              alt={t.title}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {t.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {t.artist}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddTrack(t)}
                            disabled={isAdded}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                              isAdded
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-default'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 active:scale-95'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                Add
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{tracks.length} songs currently in playlist</span>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
