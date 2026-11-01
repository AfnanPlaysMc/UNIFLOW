export type AudioSourceType = 'audius' | 'deezer' | 'youtube' | 'official_embed' | 'unavailable';

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  artwork: string;
  duration: number; // in seconds
  streamUrl?: string;
  source: AudioSourceType;
  isFullLength: boolean;
  previewUrl?: string;
  explicit?: boolean;
  releaseDate?: string;
  genre?: string;
  rank?: number;
  videoId?: string;
}

export interface Artist {
  id: string;
  name: string;
  picture: string;
  pictureBig?: string;
  nbFans?: number;
  nbAlbums?: number;
  bio?: string;
  genres?: string[];
  topTracks?: Track[];
  albums?: Album[];
}

export interface Album {
  id: string;
  title: string;
  cover: string;
  coverBig?: string;
  artist: string;
  artistId?: string;
  releaseDate?: string;
  trackCount?: number;
  duration?: number;
  tracks?: Track[];
  genre?: string;
}

export interface Playlist {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  tracks: Track[];
  trackCount: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryItem {
  historyId: string;
  track: Track;
  playedAt: string;
  playCount: number;
}

export interface LyricLine {
  time: number; // seconds
  text: string;
}

export interface LyricsData {
  synced: boolean;
  lines: LyricLine[];
  plainText?: string;
  provider?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface EqualizerBandConfig {
  frequency: number;
  label: string;
}

export interface EqualizerPreset {
  id: string;
  name: string;
  gains: number[]; // 10 bands (-12 to +12 dB)
}

export interface UserPreferences {
  themeAccent: string;
  crossfade: number; // 0 to 12 seconds
  equalizerPreset: string;
  audioQuality: 'auto' | 'high' | 'normal';
  volumeNormalization: boolean;
  compactMode: boolean;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
}
