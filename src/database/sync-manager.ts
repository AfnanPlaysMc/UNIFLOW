import { Track, Playlist, HistoryItem, UserPreferences } from '../types';
import { localDB } from './indexed-db';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

export class SyncManager {
  /**
   * Save a favorite track both locally and in Firestore (if user is authenticated)
   */
  public static async saveFavorite(track: Track): Promise<void> {
    await localDB.saveFavorite(track);

    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/favorites/${track.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'favorites', track.id), {
          trackId: track.id,
          userId: user.uid,
          title: track.title,
          artist: track.artist,
          album: track.album || '',
          artwork: track.artwork || '',
          duration: track.duration || 0,
          streamUrl: track.streamUrl || '',
          source: track.source,
          addedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn(`[SyncManager] Cloud Firestore write warning for favorite (${path}):`, err);
      }
    }
  }

  /**
   * Remove a favorite track both locally and in Firestore
   */
  public static async removeFavorite(trackId: string): Promise<void> {
    await localDB.removeFavorite(trackId);

    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/favorites/${trackId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'favorites', trackId));
      } catch (err) {
        console.warn(`[SyncManager] Cloud Firestore delete warning for favorite (${path}):`, err);
      }
    }
  }

  /**
   * Save a playlist both locally and in Firestore
   */
  public static async savePlaylist(playlist: Playlist): Promise<void> {
    const safeTracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
    const normalized: Playlist = {
      ...playlist,
      tracks: safeTracks,
      trackCount: safeTracks.length,
      duration: playlist.duration || 0,
    };

    await localDB.savePlaylist(normalized);

    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/playlists/${playlist.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'playlists', playlist.id), {
          playlistId: playlist.id,
          userId: user.uid,
          title: playlist.title,
          description: playlist.description || '',
          coverUrl: playlist.coverUrl || '',
          trackCount: safeTracks.length,
          duration: normalized.duration,
          tracks: safeTracks,
          createdAt: playlist.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn(`[SyncManager] Cloud Firestore write warning for playlist (${path}):`, err);
      }
    }
  }

  /**
   * Delete a playlist both locally and in Firestore
   */
  public static async deletePlaylist(playlistId: string): Promise<void> {
    await localDB.deletePlaylist(playlistId);

    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/playlists/${playlistId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'playlists', playlistId));
      } catch (err) {
        console.warn(`[SyncManager] Cloud Firestore delete warning for playlist (${path}):`, err);
      }
    }
  }

  /**
   * Record played track into history
   */
  public static async recordHistory(track: Track): Promise<void> {
    await localDB.recordHistory(track);

    const user = auth.currentUser;
    if (user) {
      const histId = `hist_${Date.now()}`;
      const path = `users/${user.uid}/history/${histId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'history', histId), {
          historyId: histId,
          trackId: track.id,
          userId: user.uid,
          title: track.title,
          artist: track.artist,
          album: track.album || '',
          artwork: track.artwork || '',
          duration: track.duration || 0,
          source: track.source,
          playedAt: new Date().toISOString(),
        });
      } catch (err) {
        // Soft fail for history logging
      }
    }
  }

  /**
   * Syncs Cloud Firestore data into local storage when user signs in
   */
  public static async syncFromCloud(userId: string): Promise<{
    favorites: Track[];
    playlists: Playlist[];
  }> {
    const cloudFavorites: Track[] = [];
    const cloudPlaylists: Playlist[] = [];

    try {
      // Fetch favorites
      const favSnapshot = await getDocs(collection(db, 'users', userId, 'favorites'));
      for (const docSnap of favSnapshot.docs) {
        const d = docSnap.data();
        const tr: Track = {
          id: d.trackId,
          title: d.title,
          artist: d.artist,
          album: d.album || '',
          artwork: d.artwork || '',
          duration: d.duration || 0,
          streamUrl: d.streamUrl || '',
          source: d.source || 'audius',
          isFullLength: d.source === 'audius',
        };
        cloudFavorites.push(tr);
        await localDB.saveFavorite(tr);
      }

      // Fetch playlists
      const playSnapshot = await getDocs(collection(db, 'users', userId, 'playlists'));
      for (const docSnap of playSnapshot.docs) {
        const p = docSnap.data();
        const pl: Playlist = {
          id: p.playlistId,
          userId: p.userId,
          title: p.title,
          description: p.description,
          coverUrl: p.coverUrl,
          trackCount: p.trackCount || (p.tracks ? p.tracks.length : 0),
          duration: p.duration || 0,
          tracks: p.tracks || [],
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        };
        cloudPlaylists.push(pl);
        await localDB.savePlaylist(pl);
      }
    } catch (err) {
      console.warn('[SyncManager] Error syncing from cloud:', err);
    }

    return { favorites: cloudFavorites, playlists: cloudPlaylists };
  }
}
