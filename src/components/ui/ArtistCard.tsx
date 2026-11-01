import React from 'react';
import { Artist } from '../../types';
import { Play } from 'lucide-react';

interface ArtistCardProps {
  artist: Artist;
  onSelect: (artist: Artist) => void;
  onPlay?: (artist: Artist) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onSelect, onPlay }) => {
  return (
    <div
      onClick={() => onSelect(artist)}
      className="group relative p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0B0F19] hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 cursor-pointer flex flex-col items-center text-center shadow-xs hover:shadow-xl"
    >
      <div className="relative aspect-square w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-md mb-3.5 max-w-[180px]">
        <img
          src={artist.picture || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'}
          alt={artist.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {onPlay && (
          <button
            aria-label={`Play artist ${artist.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(artist);
            }}
            className="absolute right-2 bottom-2 w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        )}
      </div>

      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate w-full group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {artist.name}
      </h4>
      <p className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500 capitalize mt-1">
        Verified Artist
      </p>
    </div>
  );
};
