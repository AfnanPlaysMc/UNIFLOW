import { Track } from '../types';
import { fetchProxiedJson } from './proxyClient';

let cachedAudiusHost = 'https://api.audius.co';
let hostResolved = false;

export async function getAudiusHost(): Promise<string> {
  if (hostResolved) return cachedAudiusHost;
  try {
    const res = await fetchProxiedJson<{ data: string[] }>('https://api.audius.co');
    if (res.data && res.data.length > 0) {
      cachedAudiusHost = res.data[0];
      hostResolved = true;
    }
  } catch (e) {
    console.warn('[Audius] Could not resolve discovery host, using default:', cachedAudiusHost);
  }
  return cachedAudiusHost;
}

function mapAudiusTrack(t: any, host: string): Track {
  let artwork = '';
  if (t.artwork) {
    artwork = t.artwork['480x480'] || t.artwork['1000x1000'] || t.artwork['150x150'] || '';
  }
  if (!artwork && t.user?.profile_picture) {
    artwork = t.user.profile_picture['480x480'] || t.user.profile_picture['1000x1000'] || '';
  }

  const streamUrl = `${host}/v1/tracks/${t.id}/stream?app_name=WAVEFORM`;

  return {
    id: `audius_${t.id}`,
    title: t.title || 'Untitled Track',
    artist: t.user?.name || 'Audius Artist',
    album: t.album_name || (t.genre ? `${t.genre} Single` : 'Audius Release'),
    artwork: artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
    duration: Math.round(t.duration || 180),
    streamUrl,
    previewUrl: streamUrl,
    source: 'audius',
    isFullLength: true, // Audius streams are full-length tracks!
    genre: t.genre || 'Electronic',
    releaseDate: t.release_date,
  };
}

export async function getAudiusTrendingTracks(limit = 20): Promise<Track[]> {
  const host = await getAudiusHost();
  const url = `${host}/v1/tracks/trending?app_name=WAVEFORM&limit=${limit}`;
  const res = await fetchProxiedJson<{ data: any[] }>(url);
  return (res.data || [])
    .filter((t) => !t.is_delete && t.is_streamable !== false && t.duration > 0)
    .map((t) => mapAudiusTrack(t, host));
}

export async function searchAudiusTracks(query: string, limit = 20): Promise<Track[]> {
  if (!query.trim()) return [];
  const host = await getAudiusHost();
  const url = `${host}/v1/tracks/search?query=${encodeURIComponent(query.trim())}&app_name=WAVEFORM&limit=${limit}`;
  const res = await fetchProxiedJson<{ data: any[] }>(url);
  return (res.data || [])
    .filter((t) => !t.is_delete && t.is_streamable !== false && t.duration > 0)
    .map((t) => mapAudiusTrack(t, host));
}
