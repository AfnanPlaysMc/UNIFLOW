import React, { useState } from 'react';
import { Track } from '../../types';
import { useAudio } from '../../context/AudioContext';
import { useLibrary } from '../../context/LibraryContext';
import { Play, Pause, Heart, MoreHorizontal, Plus, ListPlus, Check, Download } from 'lucide-react';
import { formatDuration } from './TrackItem';
import { navigateToHash } from '../../utils/router';
import { downloadTrack } from '../../utils/downloadHelper';

interface SongCardProps {
  track: Track;
  index?: number;
  playlistContext?: Track[];
  onSelectArtist?: (artistName: string) => void;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300';

export const SongCard: React.FC<SongCardProps> = ({
  track,
  index,
  playlistContext,
  onSelectArtist,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue } = useAudio();
  const { isFavorite, toggleFavorite, playlists, addTrackToPlaylist } = useLibrary();
  const [imgSrc, setImgSrc] = useState(track.artwork || DEFAULT_COVER);
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

  const handleArtistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectArtist) {
      onSelectArtist(track.artist);
    } else {
      navigateToHash('artist', track.artist);
    }
  };

  return (
    <div
      onClick={handlePlayClick}
      className={`group relative flex flex-col p-3 rounded-2xl cursor-pointer transition-all duration-200 border bg-white dark:bg-[#0B0F19] shadow-xs hover:shadow-md ${
        isCurrent
          ? 'border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/40'
          : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
      }`}
    >
      {/* Square Album Art with Play Overlay */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3 border border-slate-100 dark:border-slate-800">
        <img
          src={imgSrc}
          alt={track.title}
          onError={() => setImgSrc(DEFAULT_COVER)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-mono font-medium shadow-xs pointer-events-none">
          {formatDuration(track.duration)}
        </div>

        {/* Favorite icon on top right */}
        <button
          aria-label={isFav ? `Remove ${track.title} from favorites` : `Add ${track.title} to favorites`}
          onClick={handleFavoriteClick}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-xs transition-all shadow-xs ${
            isFav
              ? 'bg-white dark:bg-slate-900 text-rose-500 opacity-100'
              : 'bg-white/80 dark:bg-slate-900/80 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
        </button>

        {/* Circular Play / Pause Overlay Button */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all ${
            isPlayingThis
              ? 'bg-black/25 opacity-100'
              : 'bg-black/20 opacity-0 group-hover:opacity-100'
          }`}
        >
          <button
            aria-label={isPlayingThis ? `Pause ${track.title}` : `Play ${track.title}`}
            onClick={handlePlayClick}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          >
            {isPlayingThis ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Track Information */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p
            className={`font-bold text-xs sm:text-sm truncate ${
              isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'
            }`}
            title={track.title}
          >
            {track.title}
          </p>
          {track.explicit && (
            <span className="text-[9px] px-1 py-0.2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold rounded shrink-0">
              E
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
          <span
            onClick={handleArtistClick}
            className="hover:underline hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
            title={track.artist}
          >
            {track.artist}
          </span>
        </p>
      </div>

      {/* Bottom Options Row */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
        <span className="truncate">
          {track.album && track.album !== track.title ? track.album : 'Single'}
        </span>

        <div className="relative">
          <button
            aria-label={`Options for ${track.title}`}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Options Dropdown */}
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 text-xs text-slate-700 dark:text-slate-200"
            >
              <button
                onClick={handleAddToQueue}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left font-medium"
              >
                <ListPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Add to Queue
              </button>
              <button
                onClick={handleDownloadClick}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left font-medium"
              >
                <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Download Audio
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPlaylistPicker(!showPlaylistPicker);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left font-medium"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Add to Playlist...
              </button>

              {showPlaylistPicker && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1 max-h-32 overflow-y-auto">
                  {playlists.length === 0 ? (
                    <div className="px-3 py-1 text-slate-400 dark:text-slate-500 italic">No playlists</div>
                  ) : (
                    playlists.map((pl) => {
                      const tracks = Array.isArray(pl.tracks) ? pl.tracks : [];
                      const isAlreadyIn = tracks.some((t) => t.id === track.id);
                      return (
                        <button
                          key={pl.id}
                          onClick={() => handleAddToPlaylist(pl.id, pl.title)}
                          className="w-full px-3 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-left truncate flex items-center justify-between"
                        >
                          <span className="truncate">{pl.title}</span>
                          {isAlreadyIn && (
                            <Check className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating feedback toast */}
      {addedToast && (
        <div className="absolute right-2 -top-7 px-2 py-0.5 bg-slate-900 dark:bg-white border border-slate-700 dark:border-slate-300 rounded text-[11px] text-white dark:text-slate-900 shadow-lg pointer-events-none z-50 whitespace-nowrap">
          {addedToast}
        </div>
      )}
    </div>
  );
};
