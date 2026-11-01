import React, { useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useLibrary } from '../../context/LibraryContext';
import { WaveformSeekbar } from './WaveformSeekbar';
import { SleepTimerModal } from './SleepTimerModal';
import { formatDuration } from '../ui/TrackItem';
import { downloadTrack } from '../../utils/downloadHelper';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  Volume1,
  Mic2,
  ListMusic,
  Maximize2,
  Moon,
  Loader2,
  Download,
} from 'lucide-react';

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isReplayerActive,
    isShuffled,
    isLyricsOpen,
    isQueueOpen,
    isFullLength,
    playbackError,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleReplayer,
    setIsLyricsOpen,
    setIsQueueOpen,
    setIsFullScreen,
  } = useAudio();

  const { isFavorite, toggleFavorite } = useLibrary();
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  if (!currentTrack) return null;

  const isFav = isFavorite(currentTrack.id);

  const handleDownload = () => {
    const res = downloadTrack(currentTrack);
    setDownloadToast(res.message);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-xl transition-colors">
        {/* Error notification banner if any */}
        {playbackError && (
          <div className="text-center text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 py-1 -mt-2.5 -mx-4 mb-2 font-medium">
            {playbackError}
          </div>
        )}

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Track Info */}
          <div className="flex items-center gap-3 w-1/4 min-w-[180px] max-w-[280px]">
            <div
              onClick={() => setIsFullScreen(true)}
              className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer group shadow-xs"
            >
              <img
                src={currentTrack.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150'}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-blue-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p
                onClick={() => setIsFullScreen(true)}
                className="text-sm font-semibold text-slate-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {currentTrack.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentTrack.artist}</p>
                {isFullLength || duration > 45 || currentTrack.videoId ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100/90 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                    FULL SONG
                  </span>
                ) : (
                  <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shrink-0">
                    Preview
                  </span>
                )}
              </div>
            </div>

            <button
              aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
              onClick={() => toggleFavorite(currentTrack)}
              className={`p-1.5 rounded-full transition-colors ${
                isFav ? 'text-rose-500' : 'text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Center: Controls & Waveform Seekbar */}
          <div className="flex-1 max-w-2xl flex flex-col items-center">
            {/* Control buttons */}
            <div className="flex items-center gap-3 mb-1">
              <button
                aria-label="Toggle Shuffle"
                onClick={toggleShuffle}
                className={`p-1.5 rounded-full transition-colors ${
                  isShuffled ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title={isShuffled ? "Shuffle: On" : "Shuffle: Off"}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                aria-label="Previous Track"
                onClick={prevTrack}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                aria-label={isPlaying ? 'Pause' : 'Play'}
                onClick={togglePlay}
                disabled={isLoading}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                aria-label="Next Track"
                onClick={nextTrack}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              {/* REPLAYER Button (Repeats song after finishing) */}
              <button
                aria-label="Replayer: Repeat song continuously"
                onClick={toggleReplayer}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isReplayerActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800'
                }`}
                title={
                  isReplayerActive
                    ? 'Replayer: ACTIVE (song will replay on finish)'
                    : 'Replayer: OFF (click to repeat song on finish)'
                }
              >
                <Repeat1 className="w-3.5 h-3.5" />
                <span className="text-[11px]">{isReplayerActive ? 'Replay ON' : 'Replay'}</span>
              </button>
            </div>

            {/* Waveform Seekbar & Timestamps */}
            <div className="w-full flex items-center gap-2">
              <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 w-9 text-right shrink-0">
                {formatDuration(currentTime)}
              </span>
              <div className="flex-1">
                <WaveformSeekbar height={24} barCount={56} />
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 w-9 shrink-0">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Right: Aux Tools & Volume (Full mode & Equalizer removed per request) */}
          <div className="hidden md:flex items-center justify-end gap-2.5 w-1/4 min-w-[220px]">
            {/* Download Song Button */}
            <button
              aria-label="Download Song"
              onClick={handleDownload}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Download song to device (MP3)"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Lyrics Button */}
            <button
              aria-label="Toggle Lyrics"
              onClick={() => setIsLyricsOpen(!isLyricsOpen)}
              className={`p-2 rounded-xl transition-all ${
                isLyricsOpen
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Synchronized Lyrics"
            >
              <Mic2 className="w-4 h-4" />
            </button>

            {/* Queue Button */}
            <button
              aria-label="Toggle Queue"
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              className={`p-2 rounded-xl transition-all ${
                isQueueOpen
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Play Queue"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Sleep Timer */}
            <button
              aria-label="Sleep Timer"
              onClick={() => setIsSleepModalOpen(true)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Sleep Timer"
            >
              <Moon className="w-4 h-4" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                aria-label="Mute/Unmute"
                onClick={toggleMute}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 accent-blue-600 cursor-pointer"
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Download Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-24 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Download className="w-4 h-4 text-blue-400 dark:text-blue-600 animate-bounce" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Sleep Timer Modal */}
      {isSleepModalOpen && <SleepTimerModal onClose={() => setIsSleepModalOpen(false)} />}
    </>
  );
};
