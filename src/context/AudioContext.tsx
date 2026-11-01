import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { Track, RepeatMode, AudioSourceType } from '../types';
import { AudioEngine } from '../audio/audio-engine';
import { AudioSourceResolver } from '../audio/source-resolver';
import { youtubePlayerManager } from '../audio/youtube-player';
import { useLibrary } from './LibraryContext';

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  repeatMode: RepeatMode;
  isReplayerActive: boolean;
  isShuffled: boolean;
  queue: Track[];
  queueIndex: number;
  currentSource: AudioSourceType;
  isFullLength: boolean;
  preferFullLength: boolean;
  activePresetId: string;
  bandGains: number[];
  sleepTimerRemaining: number | null;
  isEqualizerOpen: boolean;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  isFullScreen: boolean;
  playbackError: string | null;
  // Controls
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleReplayer: () => void;
  togglePreferFullLength: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setEqualizerPreset: (presetId: string) => void;
  setBandGain: (index: number, gain: number) => void;
  startSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;
  setIsEqualizerOpen: (open: boolean) => void;
  setIsLyricsOpen: (open: boolean) => void;
  setIsQueueOpen: (open: boolean) => void;
  setIsFullScreen: (open: boolean) => void;
}

const AudioContext = createContext<AudioContextType>({} as AudioContextType);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { recordPlayedTrack } = useLibrary();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const failedUrlsForTrackRef = useRef<Set<string>>(new Set());

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRateState] = useState<number>(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [currentSource, setCurrentSource] = useState<AudioSourceType>('audius');
  const [isFullLength, setIsFullLength] = useState<boolean>(false);
  const [preferFullLength, setPreferFullLength] = useState<boolean>(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Equalizer
  const [activePresetId, setActivePresetId] = useState<string>('flat');
  const [bandGains, setBandGains] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  // UI Panels
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Sleep Timer
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Latest state references to avoid stale event listener closures
  const handleTrackEndRef = useRef<() => void>(() => {});
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  repeatModeRef.current = repeatMode;
  const currentTrackRef = useRef<Track | null>(currentTrack);
  currentTrackRef.current = currentTrack;

  // Initialize HTMLAudioElement and AudioEngine
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const engine = AudioEngine.getInstance();
    engine.init(audio);

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        if (currentTrackRef.current && Math.abs(currentTrackRef.current.duration - Math.round(audio.duration)) > 2) {
          setCurrentTrack((prev) =>
            prev
              ? {
                  ...prev,
                  duration: Math.round(audio.duration),
                  isFullLength: audio.duration > 45,
                }
              : null
          );
        }
      }
      setIsLoading(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setPlaybackError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      handleTrackEndRef.current();
    };

    const handleError = () => {
      const track = currentTrackRef.current;
      if (
        !audio.src ||
        audio.src.includes(window.location.host) ||
        track?.source === 'youtube' ||
        track?.videoId
      ) {
        return;
      }
      console.warn('[AudioContext] Audio stream error on source:', audio.src);
      setIsLoading(false);
      handlePlaybackFailure();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  // Update Media Session API
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: [
          { src: currentTrack.artwork || '', sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => resume());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      });
    }
  }, [currentTrack]);

  // Handle Playback Failure fallback: automatically cascades to alternative providers (Audius, Deezer proxy)
  const handlePlaybackFailure = async () => {
    const track = currentTrackRef.current;
    if (!track) return;
    if (track.source === 'youtube' || track.videoId) {
      setPlaybackError(null);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    const currentUrl = audio.src || '';
    if (currentUrl) failedUrlsForTrackRef.current.add(currentUrl);

    console.log('[AudioContext] Auto-resolving fallback stream for:', track.title);
    setIsLoading(true);

    try {
      const fallback = await AudioSourceResolver.resolveAlternativeSource(
        track,
        failedUrlsForTrackRef.current
      );

      if (fallback && fallback.streamUrl) {
        failedUrlsForTrackRef.current.add(fallback.streamUrl);
        setCurrentSource(fallback.source);
        setIsFullLength(fallback.isFullLength);

        audio.src = fallback.streamUrl;
        audio.load();
        await audio.play();
        setIsPlaying(true);
        setIsLoading(false);
        setPlaybackError(null);
        return;
      }
    } catch (err) {
      console.warn('[AudioContext] Fallback resolution failed:', err);
    }

    setIsPlaying(false);
    setIsLoading(false);
    setPlaybackError('Stream temporarily unavailable for this track.');
  };

  const handleTrackEnd = () => {
    const currentRepeat = repeatModeRef.current;
    if (currentRepeat === 'one') {
      seek(0);
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      setIsPlaying(true);
      return;
    }

    if (queueIndex < queue.length - 1) {
      playQueueIndex(queueIndex + 1);
    } else if (currentRepeat === 'all' && queue.length > 0) {
      playQueueIndex(0);
    } else {
      seek(0);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };
  handleTrackEndRef.current = handleTrackEnd;

  const playQueueIndex = async (index: number) => {
    if (index < 0 || index >= queue.length) return;
    const target = queue[index];
    setQueueIndex(index);
    await startPlayback(target);
  };

  const startPlayback = async (track: Track) => {
    setIsLoading(true);
    setPlaybackError(null);
    setCurrentTrack(track);
    currentTrackRef.current = track;
    failedUrlsForTrackRef.current.clear();

    const audio = audioRef.current;
    if (!audio) return;

    try {
      // Resolve direct audio source across Deezer, Audius
      const resolved = await AudioSourceResolver.resolveSource(track);

      let chosenUrl = resolved.streamUrl;
      let chosenSource = resolved.source;
      let chosenFullLength = resolved.isFullLength;

      if (!chosenUrl) {
        // Auto-search fallback immediately
        const fallback = await AudioSourceResolver.resolveAlternativeSource(
          track,
          failedUrlsForTrackRef.current
        );
        if (fallback && fallback.streamUrl) {
          chosenUrl = fallback.streamUrl;
          chosenSource = fallback.source;
          chosenFullLength = fallback.isFullLength;
        } else {
          setIsLoading(false);
          setPlaybackError('No stream available for this title.');
          return;
        }
      }

      failedUrlsForTrackRef.current.add(chosenUrl);
      setCurrentSource(chosenSource);
      setIsFullLength(chosenFullLength);

      const upgradedTrack: Track = {
        ...track,
        source: chosenSource,
        isFullLength: chosenFullLength,
        streamUrl: chosenUrl,
        videoId: resolved.videoId || track.videoId,
      };
      setCurrentTrack(upgradedTrack);
      currentTrackRef.current = upgradedTrack;

      if (chosenSource === 'youtube' || resolved.videoId) {
        youtubePlayerManager.stop();
        youtubePlayerManager.setCallback((state) => {
          if (state.error) {
            console.warn('[AudioContext] YouTube player error:', state.error);
            handlePlaybackFailure();
            return;
          }
          if (state.isEnded) {
            handleTrackEndRef.current();
            return;
          }
          setIsPlaying(state.isPlaying);
          setIsLoading(state.isLoading);
          if (state.currentTime > 0) setCurrentTime(state.currentTime);
          if (state.duration > 0) setDuration(state.duration);
          setPlaybackError(null);
        });

        audio.pause();
        audio.removeAttribute('src');

        const vId = resolved.videoId || track.videoId || '';
        youtubePlayerManager.playVideo(vId);
        youtubePlayerManager.setVolume(isMuted ? 0 : volume);

        setIsPlaying(true);
        setIsLoading(false);
        setPlaybackError(null);
        recordPlayedTrack(upgradedTrack);
        return;
      } else {
        youtubePlayerManager.stop();
        youtubePlayerManager.setCallback(null);
      }

      AudioEngine.getInstance().ensureContextRunning();
      audio.src = chosenUrl;
      audio.playbackRate = playbackRate;
      audio.volume = isMuted ? 0 : volume;
      audio.load();
      await audio.play();
      setIsPlaying(true);
      setIsLoading(false);

      recordPlayedTrack(upgradedTrack);
    } catch (err: any) {
      console.warn('[AudioContext] Initial play failed, falling back:', err);
      handlePlaybackFailure();
    }
  };

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    if (newQueue && newQueue.length > 0) {
      setOriginalQueue(newQueue);
      let list = [...newQueue];
      if (isShuffled) {
        const withoutTarget = list.filter((t) => t.id !== track.id);
        const shuffled = withoutTarget.sort(() => Math.random() - 0.5);
        list = [track, ...shuffled];
      }
      setQueue(list);
      const targetIndex = list.findIndex((t) => t.id === track.id);
      setQueueIndex(targetIndex >= 0 ? targetIndex : 0);
    } else {
      const existingIdx = queue.findIndex((t) => t.id === track.id);
      if (existingIdx !== -1) {
        setQueueIndex(existingIdx);
      } else {
        const updated = [...queue, track];
        setQueue(updated);
        setQueueIndex(updated.length - 1);
      }
    }
    await startPlayback(track);
  };

  const togglePlay = () => {
    if (currentSource === 'youtube' || currentTrackRef.current?.videoId) {
      if (isPlaying) {
        youtubePlayerManager.pause();
        setIsPlaying(false);
      } else {
        youtubePlayerManager.resume();
        setIsPlaying(true);
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      AudioEngine.getInstance().ensureContextRunning();
      audio.play().catch((err) => {
        console.warn('Play error:', err);
      });
    }
  };

  const pause = () => {
    if (currentSource === 'youtube' || currentTrackRef.current?.videoId) {
      youtubePlayerManager.pause();
      setIsPlaying(false);
      return;
    }
    audioRef.current?.pause();
  };

  const resume = () => {
    if (currentSource === 'youtube' || currentTrackRef.current?.videoId) {
      youtubePlayerManager.resume();
      setIsPlaying(true);
      return;
    }
    AudioEngine.getInstance().ensureContextRunning();
    audioRef.current?.play().catch(() => {});
  };

  const seek = (seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, duration || 0));
    setCurrentTime(clamped);

    if (currentSource === 'youtube' || currentTrackRef.current?.videoId) {
      youtubePlayerManager.seekTo(clamped);
      return;
    }

    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);

    if (currentSource === 'youtube' || currentTrackRef.current?.videoId) {
      youtubePlayerManager.setVolume(isMuted ? 0 : clamped);
    }
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (currentSource === 'youtube' || currentTrackRef.current?.videoId) {
      youtubePlayerManager.setVolume(nextMuted ? 0 : volume);
    }
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
  };

  const setPlaybackRate = (rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const togglePreferFullLength = () => {
    const next = !preferFullLength;
    setPreferFullLength(next);
    localStorage.setItem('waveform_full_mode', String(next));
    if (currentTrack) {
      startPlayback(currentTrack);
    }
  };

  const nextTrack = () => {
    if (queueIndex < queue.length - 1) {
      playQueueIndex(queueIndex + 1);
    } else if (repeatMode === 'all' && queue.length > 0) {
      playQueueIndex(0);
    }
  };

  const prevTrack = () => {
    if (currentTime > 3) {
      seek(0);
      return;
    }
    if (queueIndex > 0) {
      playQueueIndex(queueIndex - 1);
    } else {
      seek(0);
    }
  };

  const toggleShuffle = () => {
    const nextShuffled = !isShuffled;
    setIsShuffled(nextShuffled);
    if (nextShuffled) {
      if (currentTrack && queue.length > 1) {
        const others = queue.filter((t) => t.id !== currentTrack.id);
        const shuffled = others.sort(() => Math.random() - 0.5);
        setQueue([currentTrack, ...shuffled]);
        setQueueIndex(0);
      }
    } else {
      if (originalQueue.length > 0) {
        setQueue(originalQueue);
        if (currentTrack) {
          const idx = originalQueue.findIndex((t) => t.id === currentTrack.id);
          setQueueIndex(idx >= 0 ? idx : 0);
        }
      }
    }
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleReplayer = () => {
    setRepeatMode((prev) => (prev === 'one' ? 'off' : 'one'));
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
    if (originalQueue.length > 0) {
      setOriginalQueue((prev) => [...prev, track]);
    }
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex((prev) => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueue(currentTrack ? [currentTrack] : []);
    setQueueIndex(currentTrack ? 0 : -1);
  };

  // Equalizer
  const setEqualizerPreset = (presetId: string) => {
    const engine = AudioEngine.getInstance();
    engine.applyPreset(presetId);
    setActivePresetId(presetId);
    setBandGains(engine.getCurrentGains());
  };

  const setBandGain = (index: number, gain: number) => {
    const engine = AudioEngine.getInstance();
    engine.setBandGain(index, gain);
    setActivePresetId('custom');
    setBandGains(engine.getCurrentGains());
  };

  // Sleep Timer
  const startSleepTimer = (minutes: number) => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    const totalSeconds = minutes * 60;
    setSleepTimerRemaining(totalSeconds);

    sleepTimerRef.current = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
          pause();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSleepTimer = () => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    setSleepTimerRemaining(null);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seek(currentTime - 5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seek(currentTime + 5);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        toggleShuffle();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        toggleRepeat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, isPlaying, isMuted, isShuffled, repeatMode, currentSource]);

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackRate,
        repeatMode,
        isReplayerActive: repeatMode === 'one',
        isShuffled,
        queue,
        queueIndex,
        currentSource,
        isFullLength,
        preferFullLength,
        activePresetId,
        bandGains,
        sleepTimerRemaining,
        isEqualizerOpen,
        isLyricsOpen,
        isQueueOpen,
        isFullScreen,
        playbackError,
        playTrack,
        togglePlay,
        pause,
        resume,
        seek,
        setVolume,
        toggleMute,
        setPlaybackRate,
        togglePreferFullLength,
        nextTrack,
        prevTrack,
        toggleShuffle,
        toggleRepeat,
        toggleReplayer,
        addToQueue,
        removeFromQueue,
        clearQueue,
        setEqualizerPreset,
        setBandGain,
        startSleepTimer,
        cancelSleepTimer,
        setIsEqualizerOpen,
        setIsLyricsOpen,
        setIsQueueOpen,
        setIsFullScreen,
      }}
    >
      {/* Hidden YouTube audio player: audio only, video completely hidden */}
      <div
        className="fixed -top-[9999px] -left-[9999px] w-[200px] h-[200px] overflow-hidden opacity-0 pointer-events-none"
        aria-hidden="true"
      >
        <div id="waveform-yt-player" className="w-full h-full" />
      </div>

      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
