import React from 'react';
import { Playlist } from '../../types';
import { ListMusic, Play } from 'lucide-react';

interface PlaylistCardProps {
  playlist: Playlist;
  onSelect: (playlist: Playlist) => void;
  onPlay?: (playlist: Playlist) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onSelect, onPlay }) => {
  const firstCover = playlist.coverUrl || (playlist.tracks.length > 0 ? playlist.tracks[0].artwork : '');

  return (
    <div
      onClick={() => onSelect(playlist)}
      className="group relative p-3 rounded-2xl bg-white dark:bg-[#0B0F19] hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 cursor-pointer flex flex-col shadow-xs hover:shadow-md"
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-3 flex items-center justify-center">
        {firstCover ? (
          <img
            src={firstCover}
            alt={playlist.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <ListMusic className="w-12 h-12 text-slate-400 dark:text-slate-600" />
        )}

        {onPlay && playlist.tracks.length > 0 && (
          <button
            aria-label={`Play playlist ${playlist.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(playlist);
            }}
            className="absolute right-2.5 bottom-2.5 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        )}
      </div>

      <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {playlist.title}
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
        {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
      </p>
    </div>
  );
};
