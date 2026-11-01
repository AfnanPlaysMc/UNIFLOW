import React, { useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useLibrary } from '../../context/LibraryContext';
import { ListMusic, X, Trash2, BookmarkPlus } from 'lucide-react';
import { formatDuration } from '../ui/TrackItem';

export const QueueDrawer: React.FC = () => {
  const {
    isQueueOpen,
    setIsQueueOpen,
    queue,
    queueIndex,
    currentTrack,
    playTrack,
    removeFromQueue,
    clearQueue,
  } = useAudio();
  const { createPlaylist } = useLibrary();
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isQueueOpen) return null;

  const currentItem = currentTrack;
  const upNext = queue.slice(queueIndex + 1);

  const handleSaveAsPlaylist = async () => {
    if (queue.length === 0) return;
    await createPlaylist(`Queue ${new Date().toLocaleDateString()}`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[60] w-full sm:w-96 bg-white/98 dark:bg-[#0B0F19]/98 backdrop-blur-xl border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Play Queue</h3>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono font-semibold">
            {queue.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearQueue}
            title="Clear Queue"
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsQueueOpen(false)}
            aria-label="Close Queue"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Queue Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Now Playing */}
        {currentItem && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Now Playing
            </h4>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
              <img
                src={currentItem.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                alt={currentItem.title}
                className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400 truncate">{currentItem.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{currentItem.artist}</p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                {formatDuration(currentItem.duration)}
              </span>
            </div>
          </div>
        )}

        {/* Up Next */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Up Next ({upNext.length})
            </h4>
            {queue.length > 0 && (
              <button
                onClick={handleSaveAsPlaylist}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                {saveSuccess ? 'Saved!' : 'Save as Playlist'}
              </button>
            )}
          </div>

          {upNext.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-6 text-center">
              No upcoming tracks. Add tracks from any album or search result!
            </p>
          ) : (
            <div className="space-y-1.5">
              {upNext.map((track, idx) => {
                const actualIndex = queueIndex + 1 + idx;
                return (
                  <div
                    key={`${track.id}_${actualIndex}`}
                    className="group flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                  >
                    <img
                      src={track.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                      alt={track.title}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => playTrack(track)}
                    >
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{track.artist}</p>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500">
                      {formatDuration(track.duration)}
                    </span>
                    <button
                      aria-label="Remove from queue"
                      onClick={() => removeFromQueue(actualIndex)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
