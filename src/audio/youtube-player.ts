declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

type YouTubeStateCallback = (state: {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  isEnded: boolean;
  error?: string;
}) => void;

class YouTubeAudioPlayerManager {
  private static instance: YouTubeAudioPlayerManager;
  private player: any = null;
  private isApiReady = false;
  private pendingVideoId: string | null = null;
  private intervalId: any = null;
  private callback: YouTubeStateCallback | null = null;
  private currentVideoId: string | null = null;

  private constructor() {
    this.initScript();
  }

  public static getInstance(): YouTubeAudioPlayerManager {
    if (!YouTubeAudioPlayerManager.instance) {
      YouTubeAudioPlayerManager.instance = new YouTubeAudioPlayerManager();
    }
    return YouTubeAudioPlayerManager.instance;
  }

  private initScript() {
    if (typeof window === 'undefined') return;

    if (window.YT && window.YT.Player) {
      this.isApiReady = true;
      this.createPlayerElement();
      return;
    }

    const existingScript = document.getElementById('yt-iframe-api-script');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      this.isApiReady = true;
      this.createPlayerElement();
    };
  }

  private createPlayerElement() {
    if (typeof document === 'undefined') return;
    let container = document.getElementById('waveform-yt-hidden-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'waveform-yt-hidden-container';
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '320px';
      container.style.height = '180px';
      container.style.opacity = '0.001';
      container.style.pointerEvents = 'none';
      container.style.overflow = 'hidden';
      container.style.zIndex = '-9999';
      document.body.appendChild(container);

      const playerDiv = document.createElement('div');
      playerDiv.id = 'waveform-yt-player-target';
      container.appendChild(playerDiv);
    }

    try {
      this.player = new window.YT.Player('waveform-yt-player-target', {
        height: '1',
        width: '1',
        videoId: this.pendingVideoId || '',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            if (this.pendingVideoId) {
              event.target.loadVideoById(this.pendingVideoId);
              event.target.playVideo();
              this.pendingVideoId = null;
            }
          },
          onStateChange: (event: any) => {
            this.handleStateChange(event.data);
          },
          onError: (event: any) => {
            console.warn('[YouTubeAudioPlayerManager] YT Error code:', event.data);
            this.stopProgressInterval();
            if (this.callback) {
              this.callback({
                isPlaying: false,
                isLoading: false,
                currentTime: 0,
                duration: 0,
                isEnded: false,
                error: `YouTube playback error (${event.data})`,
              });
            }
          },
        },
      });
    } catch (err) {
      console.warn('[YouTubeAudioPlayerManager] Player init failed:', err);
    }
  }

  public setCallback(cb: YouTubeStateCallback | null) {
    this.callback = cb;
  }

  public playVideo(videoId: string) {
    this.currentVideoId = videoId;
    if (this.player && typeof this.player.loadVideoById === 'function') {
      try {
        this.player.loadVideoById(videoId);
        this.player.playVideo();
        this.startProgressInterval();
      } catch (err) {
        console.warn('[YouTubeAudioPlayerManager] playVideo error:', err);
      }
    } else {
      this.pendingVideoId = videoId;
      if (this.isApiReady && !this.player) {
        this.createPlayerElement();
      }
    }
  }

  public resume() {
    if (this.player && typeof this.player.playVideo === 'function') {
      try {
        this.player.playVideo();
        this.startProgressInterval();
      } catch {}
    }
  }

  public pause() {
    if (this.player && typeof this.player.pauseVideo === 'function') {
      try {
        this.player.pauseVideo();
        this.stopProgressInterval();
      } catch {}
    }
  }

  public seekTo(seconds: number) {
    if (this.player && typeof this.player.seekTo === 'function') {
      try {
        this.player.seekTo(seconds, true);
        this.emitState();
      } catch {}
    }
  }

  public setVolume(vol: number) {
    // vol is 0 to 1
    if (this.player && typeof this.player.setVolume === 'function') {
      try {
        this.player.setVolume(Math.round(vol * 100));
      } catch {}
    }
  }

  public stop() {
    this.stopProgressInterval();
    if (this.player && typeof this.player.stopVideo === 'function') {
      try {
        this.player.stopVideo();
      } catch {}
    }
    this.currentVideoId = null;
  }

  private startProgressInterval() {
    this.stopProgressInterval();
    this.intervalId = setInterval(() => {
      this.emitState();
    }, 250);
  }

  private stopProgressInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private handleStateChange(stateCode: number) {
    // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
    if (stateCode === 1) {
      // Playing
      this.startProgressInterval();
      this.emitState(true, false, false);
    } else if (stateCode === 2) {
      // Paused
      this.stopProgressInterval();
      this.emitState(false, false, false);
    } else if (stateCode === 3) {
      // Buffering
      this.emitState(true, true, false);
    } else if (stateCode === 0) {
      // Ended
      this.stopProgressInterval();
      this.emitState(false, false, true);
    }
  }

  private emitState(overridePlaying?: boolean, overrideLoading?: boolean, overrideEnded?: boolean) {
    if (!this.callback) return;

    let currentTime = 0;
    let duration = 0;

    if (this.player) {
      if (typeof this.player.getCurrentTime === 'function') {
        currentTime = this.player.getCurrentTime() || 0;
      }
      if (typeof this.player.getDuration === 'function') {
        duration = this.player.getDuration() || 0;
      }
    }

    const isPlaying = overridePlaying !== undefined ? overridePlaying : this.player ? this.player.getPlayerState?.() === 1 : false;
    const isLoading = overrideLoading !== undefined ? overrideLoading : this.player ? this.player.getPlayerState?.() === 3 : false;
    const isEnded = overrideEnded !== undefined ? overrideEnded : this.player ? this.player.getPlayerState?.() === 0 : false;

    this.callback({
      isPlaying,
      isLoading,
      currentTime,
      duration,
      isEnded,
    });
  }
}

export const youtubePlayerManager = YouTubeAudioPlayerManager.getInstance();
