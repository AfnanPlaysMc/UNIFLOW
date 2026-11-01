import React from 'react';
import { Album } from '../../types';
import { Play } from 'lucide-react';

interface AlbumCardProps {
  album: Album;
  onSelect: (album: Album) => void;
  onPlay?: (album: Album) => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, onSelect, onPlay }) => {
  return (
    <div
      onClick={() => onSelect(album)}
      className="group relative p-4 rounded-3xl bg-white dark:bg-[#0B0F19] hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 cursor-pointer flex flex-col shadow-xs hover:shadow-xl"
    >
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm mb-3.5">
        <img
          src={album.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'}
          alt={album.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {onPlay && (
          <button
            aria-label={`Play album ${album.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(album);
            }}
            className="absolute right-3 bottom-3 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105"
          >
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </button>
        )}
      </div>

      <h4 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {album.title}
      </h4>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate mt-1">
        {album.artist}
      </p>
    </div>
  );
};
