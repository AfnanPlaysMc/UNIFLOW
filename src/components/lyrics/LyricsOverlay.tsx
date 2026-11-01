import React, { useEffect, useState, useRef } from 'react';
import { useAudio } from '../../context/AudioContext';
import { fetchLyrics } from '../../services/lrclib';
import { LyricsData } from '../../types';
import { Mic2, X, Music, Sparkles, Search, RotateCcw } from 'lucide-react';

export const LyricsOverlay: React.FC = () => {
  const { currentTrack, currentTime, seek, isLyricsOpen, setIsLyricsOpen } = useAudio();
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [isSearchingCustom, setIsSearchingCustom] = useState(false);

  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const loadLyrics = (title: string, artist: string) => {
    setLoading(true);
    fetchLyrics(title, artist)
      .then((data) => {
        setLyricsData(data);
      })
      .catch(() => {
        setLyricsData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!currentTrack || !isLyricsOpen) return;
    setCustomSearchQuery(`${currentTrack.title} ${currentTrack.artist}`);
    loadLyrics(currentTrack.title, currentTrack.artist);
  }, [currentTrack?.id, isLyricsOpen]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearchQuery.trim()) return;
    setIsSearchingCustom(true);
    loadLyrics(customSearchQuery.trim(), '');
    setIsSearchingCustom(false);
  };

  // Find active line index based on currentTime
  let activeIndex = -1;
  if (lyricsData?.synced && lyricsData.lines.length > 0) {
    for (let i = 0; i < lyricsData.lines.length; i++) {
      if (currentTime >= lyricsData.lines[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Smooth scroll active line to center
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!isLyricsOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white/98 dark:bg-[#060913]/98 backdrop-blur-2xl text-slate-900 dark:text-white transition-colors">
      {/* Top Bar */}
      <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Mic2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
              <span className="truncate">{currentTrack?.title || 'No Track Playing'}</span>
              {lyricsData?.synced && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3" /> Live Synced
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentTrack?.artist}</p>
          </div>
        </div>

        <button
          aria-label="Close Lyrics"
          onClick={() => setIsLyricsOpen(false)}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Manual Search Bar (in case automated lookup needs adjustment) */}
      <div className="px-6 py-2.5 bg-slate-50 dark:bg-[#0A0E1A] border-b border-slate-200 dark:border-slate-800 flex items-center justify-center">
        <form onSubmit={handleManualSearch} className="w-full max-w-lg flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={customSearchQuery}
              onChange={(e) => setCustomSearchQuery(e.target.value)}
              placeholder="Search lyrics by song title or artist..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1"
          >
            <Search className="w-3 h-3" /> Search
          </button>
          {currentTrack && (
            <button
              type="button"
              onClick={() => {
                setCustomSearchQuery(`${currentTrack.title} ${currentTrack.artist}`);
                loadLyrics(currentTrack.title, currentTrack.artist);
              }}
              title="Reset to current track"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Lyrics Body */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-12 max-w-3xl mx-auto w-full text-center scroll-smooth space-y-6"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Fetching synchronized lyrics from LRCLIB...</p>
          </div>
        ) : !lyricsData ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 dark:text-slate-500">
            <Music className="w-12 h-12 text-slate-300 dark:text-slate-700" />
            <p className="text-base text-slate-800 dark:text-slate-200 font-bold">
              No lyrics found yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              Try searching with a shorter song name or artist title in the search box above.
            </p>
          </div>
        ) : lyricsData.synced ? (
          <div className="space-y-4 py-8">
            {lyricsData.lines.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              return (
                <div
                  key={`${line.time}_${idx}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seek(line.time)}
                  className={`cursor-pointer transition-all duration-300 py-2.5 px-4 rounded-2xl ${
                    isActive
                      ? 'text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400 scale-105 bg-blue-50/70 dark:bg-blue-950/60 shadow-sm'
                      : isPast
                      ? 'text-lg md:text-xl font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                      : 'text-lg md:text-xl font-medium text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {line.text || '♪'}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-left max-w-xl mx-auto whitespace-pre-line text-slate-800 dark:text-slate-200 leading-relaxed text-base font-medium py-6">
            {lyricsData.plainText}
          </div>
        )}
      </div>

      {/* Attribution footer */}
      <div className="py-3 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800">
        Lyrics provided by LRCLIB Open Community • Tap any line to jump audio
      </div>
    </div>
  );
};
