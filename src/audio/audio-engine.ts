import { EqualizerBandConfig, EqualizerPreset } from '../types';

export const EQ_FREQUENCIES: EqualizerBandConfig[] = [
  { frequency: 32, label: '32Hz' },
  { frequency: 64, label: '64Hz' },
  { frequency: 125, label: '125Hz' },
  { frequency: 250, label: '250Hz' },
  { frequency: 500, label: '500Hz' },
  { frequency: 1000, label: '1kHz' },
  { frequency: 2000, label: '2kHz' },
  { frequency: 4000, label: '4kHz' },
  { frequency: 8000, label: '8kHz' },
  { frequency: 16000, label: '16kHz' },
];

export const EQ_PRESETS: EqualizerPreset[] = [
  { id: 'flat', name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: 'bass_boost', name: 'Bass Boost', gains: [7, 6, 4, 2, 0, 0, 0, 0, 0, 0] },
  { id: 'treble_boost', name: 'Treble Boost', gains: [0, 0, 0, 0, 1, 2, 4, 6, 7, 8] },
  { id: 'pop', name: 'Pop', gains: [-1, 2, 4, 5, 3, 0, -1, -2, -1, 0] },
  { id: 'rock', name: 'Rock', gains: [5, 4, -1, -2, 0, 2, 3, 4, 5, 4] },
  { id: 'electronic', name: 'Electronic', gains: [6, 5, 2, 0, -2, 2, 1, 3, 5, 6] },
  { id: 'classical', name: 'Classical', gains: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4] },
  { id: 'jazz', name: 'Jazz', gains: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3] },
  { id: 'vocal', name: 'Vocal', gains: [-2, -1, 1, 3, 5, 5, 3, 1, 0, -1] },
  { id: 'acoustic', name: 'Acoustic', gains: [3, 2, 0, 1, 2, 1, 2, 3, 2, 1] },
];

export class AudioEngine {
  private static instance: AudioEngine;

  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private filterNodes: BiquadFilterNode[] = [];
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isGraphConnected = false;
  private currentPresetId = 'flat';
  private currentGains: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initializes the AudioContext and connects the HTMLAudioElement
   */
  public init(audioEl: HTMLAudioElement): void {
    if (this.audioElement === audioEl && this.isGraphConnected) return;
    this.audioElement = audioEl;

    // Enable cross-origin for audio processing where CORS allows
    try {
      this.audioElement.crossOrigin = 'anonymous';
    } catch {
      // Ignore if element already loaded
    }
  }

  private setupWebAudioGraph(): void {
    if (this.isGraphConnected || !this.audioElement) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);

      // Create 10 BiquadFilterNodes
      this.filterNodes = EQ_FREQUENCIES.map((band, idx) => {
        const filter = this.audioCtx!.createBiquadFilter();
        if (idx === 0) {
          filter.type = 'lowshelf';
        } else if (idx === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = band.frequency;
        filter.gain.value = this.currentGains[idx] || 0;
        return filter;
      });

      // Analyser Node
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 128;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Master Gain Node
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 1.0;

      // Chain: Source -> Filter[0] -> Filter[1] ... -> Analyser -> Gain -> Destination
      let lastNode: AudioNode = this.sourceNode;
      for (const filter of this.filterNodes) {
        lastNode.connect(filter);
        lastNode = filter;
      }
      lastNode.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.isGraphConnected = true;
    } catch (err) {
      console.warn('[AudioEngine] Web Audio graph could not connect to stream (fallback to direct playback):', err);
      this.isGraphConnected = false;
    }
  }

  public ensureContextRunning(): void {
    if (!this.isGraphConnected && this.audioElement) {
      this.setupWebAudioGraph();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  /**
   * Updates a single EQ band gain (-12 to +12 dB)
   */
  public setBandGain(bandIndex: number, gain: number): void {
    const clamped = Math.max(-12, Math.min(12, gain));
    this.currentGains[bandIndex] = clamped;
    this.currentPresetId = 'custom';

    if (this.filterNodes[bandIndex]) {
      this.filterNodes[bandIndex].gain.value = clamped;
    }
  }

  /**
   * Applies an EQ preset
   */
  public applyPreset(presetId: string): void {
    const preset = EQ_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    this.currentPresetId = preset.id;
    this.currentGains = [...preset.gains];

    this.filterNodes.forEach((node, idx) => {
      node.gain.value = preset.gains[idx] || 0;
    });
  }

  public getCurrentGains(): number[] {
    return [...this.currentGains];
  }

  public getCurrentPresetId(): string {
    return this.currentPresetId;
  }

  /**
   * Retrieves live frequency data (0-255 values) for live visualizer
   */
  public getFrequencyData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(array as any);
    } else {
      array.fill(0);
    }
  }

  /**
   * Retrieves live waveform time-domain data
   */
  public getWaveformData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(array as any);
    } else {
      array.fill(128);
    }
  }
}
