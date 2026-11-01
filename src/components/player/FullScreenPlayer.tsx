import React, { useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useLibrary } from '../../context/LibraryContext';
import { WaveformSeekbar } from './WaveformSeekbar';
import { SleepTimerModal } from './SleepTimerModal';
import { formatDuration } from '../ui/TrackItem';
import { downloadTrack } from '../../utils/downloadHelper';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat1,
  Heart,
  Mic2,
  ListMusic,
  Moon,
  Download,
} from 'lucide-react';

export const FullScreenPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    repeatMode,
    isReplayerActive,
    isShuffled,
    isFullScreen,
    setIsFullScreen,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleReplayer,
    setIsLyricsOpen,
    setIsQueueOpen,
  } = useAudio();

  const { isFavorite, toggleFavorite } = useLibrary();
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  if (!isFullScreen || !currentTrack) return null;

  const isFav = isFavorite(currentTrack.id);

  const handleDownload = () => {
    const res = downloadTrack(currentTrack);
    setDownloadToast(res.message);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-[#060913] text-slate-900 dark:text-white overflow-hidden select-none transition-colors">
      {/* Blurred artwork ambient backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15 dark:opacity-20 blur-3xl scale-125 pointer-events-none transition-all duration-700"
        style={{ backgroundImage: `url(${currentTrack.artwork})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 dark:from-[#060913]/90 via-slate-50/80 dark:via-[#060913]/95 to-slate-100 dark:to-black pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <button
          aria-label="Collapse Full Screen"
          onClick={() => setIsFullScreen(false)}
          className="p-2 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            NOW PLAYING
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate max-w-xs">
            {currentTrack.album || 'Single Release'}
          </p>
        </div>

        <button
          aria-label="Sleep Timer"
          onClick={() => setIsSleepModalOpen(true)}
          className="p-2 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors"
        >
          <Moon className="w-5 h-5" />
        </button>
      </div>

      {/* Center Artwork & Visualizer */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        <div className="relative aspect-square w-full max-w-[340px] rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/15 border-4 border-white dark:border-slate-800 mb-6 bg-slate-100 dark:bg-slate-900">
          <img
            src={currentTrack.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Track info & favorite button */}
        <div className="w-full flex items-center justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white truncate">
              {currentTrack.title}
            </h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {currentTrack.artist}
            </p>
          </div>

          <button
            aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
            onClick={() => toggleFavorite(currentTrack)}
            className={`p-3 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors ${
              isFav ? 'text-rose-500' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Heart className={`w-6 h-6 ${isFav ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Waveform Seekbar */}
        <div className="w-full space-y-2 mb-6">
          <WaveformSeekbar height={36} barCount={64} />
          <div className="flex items-center justify-between text-xs font-mono font-medium text-slate-400">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="w-full flex items-center justify-between mb-8">
          <button
            aria-label="Toggle Shuffle"
            onClick={toggleShuffle}
            className={`p-3 rounded-full transition-colors ${
              isShuffled ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            aria-label="Previous Track"
            onClick={prevTrack}
            className="p-3 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/35 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          <button
            aria-label="Next Track"
            onClick={nextTrack}
            className="p-3 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            aria-label="Toggle Replayer"
            onClick={toggleReplayer}
            className={`p-3 rounded-full transition-colors ${
              isReplayerActive
                ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title={isReplayerActive ? "Replayer: Active" : "Replayer: Off"}
          >
            <Repeat1 className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Feature Buttons */}
        <div className="w-full flex items-center justify-around pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setIsLyricsOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            <Mic2 className="w-5 h-5" />
            <span className="text-[11px]">Lyrics</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            <span className="text-[11px]">Download</span>
          </button>

          <button
            onClick={() => setIsQueueOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            <ListMusic className="w-5 h-5" />
            <span className="text-[11px]">Queue</span>
          </button>
        </div>
      </div>

      {downloadToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold shadow-xl">
          {downloadToast}
        </div>
      )}

      {isSleepModalOpen && <SleepTimerModal onClose={() => setIsSleepModalOpen(false)} />}
    </div>
  );
};
