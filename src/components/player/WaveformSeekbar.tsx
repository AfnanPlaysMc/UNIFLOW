import React, { useRef, useState, useEffect } from 'react';
import { useAudio } from '../../context/AudioContext';
import { AudioEngine } from '../../audio/audio-engine';
import { formatDuration } from '../ui/TrackItem';

interface WaveformSeekbarProps {
  className?: string;
  barCount?: number;
  height?: number;
}

export const WaveformSeekbar: React.FC<WaveformSeekbarProps> = ({
  className = '',
  barCount = 64,
  height = 32,
}) => {
  const { currentTime, duration, seek, isPlaying } = useAudio();
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Live frequency peaks for waveform bars
  const [livePeaks, setLivePeaks] = useState<number[]>(() =>
    Array.from({ length: barCount }, (_, i) => Math.sin(i * 0.2) * 0.3 + 0.4)
  );

  const freqArrayRef = useRef<Uint8Array>(new Uint8Array(barCount));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const engine = AudioEngine.getInstance();
    const updateWaveform = () => {
      engine.getFrequencyData(freqArrayRef.current);
      const peaks: number[] = [];
      const len = freqArrayRef.current.length;
      for (let i = 0; i < barCount; i++) {
        const val = freqArrayRef.current[i % len] / 255;
        const baseline = Math.sin((i / barCount) * Math.PI) * 0.25 + 0.15;
        peaks.push(Math.max(0.12, Math.min(1.0, val * 0.75 + baseline)));
      }
      setLivePeaks(peaks);
      rafRef.current = requestAnimationFrame(updateWaveform);
    };

    rafRef.current = requestAnimationFrame(updateWaveform);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, barCount]);

  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateSeekFromEvent(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setHoverX(clientX - rect.left);
    setHoverTime(duration * ratio);

    if (isDragging) {
      seek(duration * ratio);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      updateSeekFromEvent(e);
    }
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverTime(null);
    }
  };

  const updateSeekFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(duration * ratio);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`group relative flex items-center justify-between gap-[2px] cursor-pointer py-1 select-none ${className}`}
      style={{ height }}
    >
      {/* Bars */}
      {livePeaks.map((peak, idx) => {
        const barRatio = (idx + 0.5) / barCount;
        const isPlayed = barRatio <= progress;

        return (
          <div
            key={idx}
            className="flex-1 flex items-center justify-center h-full transition-all duration-75"
          >
            <div
              style={{
                height: `${Math.round(peak * (height - 6))}px`,
                minHeight: '3px',
              }}
              className={`w-full max-w-[4px] rounded-full transition-colors duration-150 ${
                isPlayed
                  ? 'bg-gradient-to-t from-blue-600 to-sky-400 group-hover:from-blue-500 group-hover:to-sky-300'
                  : 'bg-slate-200/90 group-hover:bg-slate-300'
              }`}
            />
          </div>
        );
      })}

      {/* Scrub Head Pin */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md shadow-blue-500/40 border-2 border-blue-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ left: `calc(${progress * 100}% - 7px)` }}
      />

      {/* Hover timestamp tooltip */}
      {hoverTime !== null && (
        <div
          className="absolute -top-7 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[11px] font-mono text-white pointer-events-none -translate-x-1/2 shadow-lg z-30"
          style={{ left: `${hoverX}px` }}
        >
          {formatDuration(hoverTime)}
        </div>
      )}
    </div>
  );
};
