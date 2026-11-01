import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Track, Playlist, HistoryItem } from '../types';
import { localDB } from '../database/indexed-db';
import { SyncManager } from '../database/sync-manager';
import { useAuth } from './AuthContext';
import { db } from '../database/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface LibraryContextType {
  favorites: Track[];
  playlists: Playlist[];
  history: HistoryItem[];
  followedArtists: string[];
  isFavorite: (trackId: string) => boolean;
  toggleFavorite: (track: Track) => Promise<void>;
  createPlaylist: (title: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  recordPlayedTrack: (track: Track) => Promise<void>;
  clearHistory: () => Promise<void>;
  isFollowingArtist: (artistName: string) => boolean;
  toggleFollowArtist: (artistName: string) => Promise<{ success: boolean; requiresAuth?: boolean; isFollowing?: boolean }>;
  refreshLibrary: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType>({
  favorites: [],
  playlists: [],
  history: [],
  followedArtists: [],
  isFavorite: () => false,
  toggleFavorite: async () => {},
  createPlaylist: async () => ({} as Playlist),
  deletePlaylist: async () => {},
  addTrackToPlaylist: async () => {},
  removeTrackFromPlaylist: async () => {},
  recordPlayedTrack: async () => {},
  clearHistory: async () => {},
  isFollowingArtist: () => false,
  toggleFollowArtist: async () => ({ success: false }),
  refreshLibrary: async () => {},
});

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [followedArtists, setFollowedArtists] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wave_followed_artists');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const loadLocalData = useCallback(async () => {
    try {
      const [favs, lists, hist] = await Promise.all([
        localDB.getFavorites(),
        localDB.getPlaylists(),
        localDB.getHistory(),
      ]);
      const normalizedLists: Playlist[] = (lists || []).map((pl) => ({
        ...pl,
        tracks: Array.isArray(pl.tracks) ? pl.tracks : [],
        trackCount: Array.isArray(pl.tracks) ? pl.tracks.length : 0,
        duration: pl.duration || 0,
      }));
      setFavorites(favs || []);
      setPlaylists(normalizedLists);
      setHistory(hist || []);
    } catch (e) {
      console.warn('Error loading library data:', e);
    }
  }, []);

  useEffect(() => {
    loadLocalData();
  }, [loadLocalData]);

  // When user signs in, sync cloud data including followed artists
  useEffect(() => {
    if (user) {
      (async () => {
        try {
          const prefRef = doc(db, 'users', user.uid, 'preferences', 'followed_artists');
          const snap = await getDoc(prefRef);
          if (snap.exists() && Array.isArray(snap.data()?.artists)) {
            const cloudFollowed: string[] = snap.data().artists;
            setFollowedArtists(cloudFollowed);
            localStorage.setItem('wave_followed_artists', JSON.stringify(cloudFollowed));
          }
        } catch (err: any) {
          const msg = err?.message || String(err);
          if (!msg.includes('token-service-api-has-not-been-used') && !msg.includes('client is offline')) {
            console.warn('[LibraryContext] Note syncing followed artists:', msg);
          }
        }
      })();
    }
  }, [user]);

  const isFavorite = useCallback(
    (trackId: string) => favorites.some((t) => t.id === trackId),
    [favorites]
  );

  const toggleFavorite = async (track: Track) => {
    const exists = isFavorite(track.id);
    if (exists) {
      setFavorites((prev) => prev.filter((t) => t.id !== track.id));
      await SyncManager.removeFavorite(track.id);
    } else {
      setFavorites((prev) => [track, ...prev]);
      await SyncManager.saveFavorite(track);
    }
  };

  const createPlaylist = async (title: string, description = ''): Promise<Playlist> => {
    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}`,
      userId: user?.uid || 'guest',
      title,
      description,
      tracks: [],
      trackCount: 0,
      duration: 0,
      coverUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
    await SyncManager.savePlaylist(newPlaylist);
    return newPlaylist;
  };

  const deletePlaylist = async (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    try {
      await SyncManager.deletePlaylist(playlistId);
    } catch (e) {
      console.warn('Error deleting playlist from storage:', e);
    }
  };

  const addTrackToPlaylist = async (playlistId: string, track: Track) => {
    let targetUpdated: Playlist | null = null;
    setPlaylists((prev) => {
      const next = prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const currentTracks = Array.isArray(pl.tracks) ? pl.tracks : [];
        if (currentTracks.some((t) => t.id === track.id)) return pl;
        const updatedTracks = [...currentTracks, track];
        const updatedPl: Playlist = {
          ...pl,
          tracks: updatedTracks,
          trackCount: updatedTracks.length,
          duration: (pl.duration || 0) + (track.duration || 0),
          coverUrl: pl.coverUrl || track.artwork || '',
          updatedAt: new Date().toISOString(),
        };
        targetUpdated = updatedPl;
        return updatedPl;
      });
      return next;
    });

    if (targetUpdated) {
      try {
        await SyncManager.savePlaylist(targetUpdated);
      } catch (e) {
        console.warn('Error saving playlist update to storage:', e);
      }
    }
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    let targetUpdated: Playlist | null = null;
    setPlaylists((prev) => {
      const next = prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const currentTracks = Array.isArray(pl.tracks) ? pl.tracks : [];
        const trackToRemove = currentTracks.find((t) => t.id === trackId);
        const updatedTracks = currentTracks.filter((t) => t.id !== trackId);
        const updatedPl: Playlist = {
          ...pl,
          tracks: updatedTracks,
          trackCount: updatedTracks.length,
          duration: Math.max(0, (pl.duration || 0) - (trackToRemove?.duration || 0)),
          coverUrl: updatedTracks.length === 0 ? '' : (pl.coverUrl || updatedTracks[0].artwork || ''),
          updatedAt: new Date().toISOString(),
        };
        targetUpdated = updatedPl;
        return updatedPl;
      });
      return next;
    });

    if (targetUpdated) {
      try {
        await SyncManager.savePlaylist(targetUpdated);
      } catch (e) {
        console.warn('Error saving playlist after track removal:', e);
      }
    }
  };

  const recordPlayedTrack = async (track: Track) => {
    await SyncManager.recordHistory(track);
    const hist = await localDB.getHistory();
    setHistory(hist);
  };

  const clearHistory = async () => {
    await localDB.clearHistory();
    setHistory([]);
  };

  const isFollowingArtist = useCallback(
    (artistName: string) => {
      if (!artistName) return false;
      const lower = artistName.trim().toLowerCase();
      return followedArtists.some((a) => a.trim().toLowerCase() === lower);
    },
    [followedArtists]
  );

  /**
   * Toggles following an artist.
   * REQUIREMENT: Must be logged in! If not logged in, returns { requiresAuth: true }
   */
  const toggleFollowArtist = async (
    artistName: string
  ): Promise<{ success: boolean; requiresAuth?: boolean; isFollowing?: boolean }> => {
    if (!artistName || !artistName.trim()) return { success: false };

    // REQUIREMENT: Must be logged in to follow!
    if (!user) {
      return { success: false, requiresAuth: true };
    }

    const clean = artistName.trim();
    const lower = clean.toLowerCase();
    const alreadyFollowing = followedArtists.some((a) => a.trim().toLowerCase() === lower);
    const nextList = alreadyFollowing
      ? followedArtists.filter((a) => a.trim().toLowerCase() !== lower)
      : [...followedArtists, clean];

    setFollowedArtists(nextList);
    try {
      localStorage.setItem('wave_followed_artists', JSON.stringify(nextList));
    } catch {}

    // Persist to Cloud Firestore under user preferences
    try {
      const prefRef = doc(db, 'users', user.uid, 'preferences', 'followed_artists');
      await setDoc(
        prefRef,
        {
          userId: user.uid,
          artists: nextList,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[LibraryContext] Error writing followed artists to Firestore:', err);
    }

    return { success: true, isFollowing: !alreadyFollowing };
  };

  return (
    <LibraryContext.Provider
      value={{
        favorites,
        playlists,
        history,
        followedArtists,
        isFavorite,
        toggleFavorite,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        recordPlayedTrack,
        clearHistory,
        isFollowingArtist,
        toggleFollowArtist,
        refreshLibrary: loadLocalData,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => useContext(LibraryContext);
