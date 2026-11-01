import React, { useState } from 'react';
import { Track } from '../../types';
import { useAudio } from '../../context/AudioContext';
import { useLibrary } from '../../context/LibraryContext';
import { Play, Pause, Heart, MoreHorizontal, Plus, ListPlus, Check, Download } from 'lucide-react';
import { downloadTrack } from '../../utils/downloadHelper';

interface TrackItemProps {
  track: Track;
  index?: number;
  playlistContext?: Track[];
  showAlbum?: boolean;
  onSelectArtist?: (artistName: string) => void;
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const TrackItem: React.FC<TrackItemProps> = ({
  track,
  index,
  playlistContext,
  showAlbum = false,
  onSelectArtist,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue } = useAudio();
  const { isFavorite, toggleFavorite, playlists, addTrackToPlaylist } = useLibrary();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const isCurrent = currentTrack?.id === track.id;
  const isPlayingThis = isCurrent && isPlaying;
  const isFav = isFavorite(track.id);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, playlistContext || [track]);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(track);
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
    setMenuOpen(false);
    triggerToast('Added to queue');
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = downloadTrack(track);
    setMenuOpen(false);
    triggerToast(res.message);
  };

  const handleAddToPlaylist = (playlistId: string, title: string) => {
    addTrackToPlaylist(playlistId, track);
    setShowPlaylistPicker(false);
    setMenuOpen(false);
    triggerToast(`Added to "${title}"`);
  };

  const triggerToast = (msg: string) => {
    setAddedToast(msg);
    setTimeout(() => setAddedToast(null), 2500);
  };

  return (
    <div
      onClick={handlePlayClick}
      className={`group relative flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
        isCurrent
          ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 shadow-sm'
          : 'bg-white dark:bg-[#0B0F19] hover:bg-slate-50/90 dark:hover:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 text-slate-700 dark:text-slate-300 shadow-xs'
      }`}
    >
      {/* Index or Play icon */}
      <div className="w-7 flex items-center justify-center text-sm font-mono font-bold text-slate-400 dark:text-slate-500 shrink-0">
        <span className={`${isCurrent ? 'text-blue-600 dark:text-blue-400 font-extrabold' : ''} group-hover:hidden`}>
          {index !== undefined ? index + 1 : ''}
        </span>
        <button
          aria-label={isPlayingThis ? `Pause ${track.title}` : `Play ${track.title}`}
          onClick={handlePlayClick}
          className="hidden group-hover:flex items-center justify-center text-blue-600 dark:text-blue-400"
        >
          {isPlayingThis ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>
      </div>

      {/* Larger Artwork Poster */}
      <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <img
          src={track.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
          alt={track.title}
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {isPlayingThis && (
          <div className="absolute inset-0 bg-blue-900/40 flex items-center justify-center">
            <div className="flex items-end gap-0.5 h-4">
              <span className="w-1 h-full bg-white animate-pulse" />
              <span className="w-1 h-2.5 bg-white animate-pulse delay-75" />
              <span className="w-1 h-full bg-white animate-pulse delay-150" />
            </div>
          </div>
        )}
      </div>

      {/* Title & Artist */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`truncate text-base font-bold ${isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
            {track.title}
          </p>
          {track.explicit && (
            <span className="text-[10px] px-1 py-0.2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold rounded">
              E
            </span>
          )}
          {track.isFullLength || track.duration > 45 || track.source === 'audius' ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/90 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
              FULL SONG
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shrink-0">
              Preview
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
          <span
            onClick={(e) => {
              if (onSelectArtist) {
                e.stopPropagation();
                onSelectArtist(track.artist);
              }
            }}
            className={onSelectArtist ? 'hover:underline hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer' : ''}
          >
            {track.artist}
          </span>
          {showAlbum && track.album && (
            <span className="text-slate-400 dark:text-slate-500 font-normal"> · {track.album}</span>
          )}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline mr-2">
          {formatDuration(track.duration)}
        </span>

        <button
          aria-label={isFav ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
          onClick={handleFavoriteClick}
          className={`p-2 rounded-full transition-colors ${
            isFav
              ? 'text-rose-500 hover:text-rose-600'
              : 'text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
        </button>

        <div className="relative">
          <button
            aria-label="More options"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-2 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {/* Context Dropdown Menu */}
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#0E1322] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-30 text-slate-700 dark:text-slate-200 text-sm font-semibold animate-in fade-in zoom-in-95 duration-150"
            >
              <button
                onClick={handleAddToQueue}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
              >
                <ListPlus className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" /> Add to Queue
              </button>

              <button
                onClick={() => setShowPlaylistPicker(!showPlaylistPicker)}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
              >
                <Plus className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" /> Add to Playlist...
              </button>

              <button
                onClick={handleDownloadClick}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left border-t border-slate-100 dark:border-slate-800/60"
              >
                <Download className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" /> Download MP3
              </button>

              {/* Nested Playlist Selector */}
              {showPlaylistPicker && (
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-1 mt-1 max-h-40 overflow-y-auto">
                  {playlists.length === 0 ? (
                    <p className="px-4 py-2 text-xs text-slate-400 font-normal">No custom playlists created</p>
                  ) : (
                    playlists.map((pl) => (
                      <button
                        key={pl.id}
                        onClick={() => handleAddToPlaylist(pl.id, pl.title)}
                        className="w-full px-5 py-2 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 text-left truncate flex items-center justify-between"
                      >
                        <span className="truncate">{pl.title}</span>
                        {pl.tracks.some((t) => t.id === track.id) && (
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {addedToast && (
        <div className="absolute right-4 -top-8 px-3 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-lg z-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {addedToast}
        </div>
      )}
    </div>
  );
};
