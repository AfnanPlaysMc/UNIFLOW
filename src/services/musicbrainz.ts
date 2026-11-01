import { fetchProxiedJson } from './proxyClient';

const MB_BASE = 'https://musicbrainz.org/ws/2';

export interface MusicBrainzArtistInfo {
  mbid: string;
  name: string;
  disambiguation?: string;
  type?: string;
  country?: string;
  genres: string[];
}

export async function lookupMusicBrainzArtist(name: string): Promise<MusicBrainzArtistInfo | null> {
  if (!name.trim()) return null;
  try {
    const url = `${MB_BASE}/artist?query=${encodeURIComponent(name.trim())}&fmt=json&limit=3`;
    const res = await fetchProxiedJson<any>(url, { cacheTtl: 600000 });
    const first = res.artists?.[0];
    if (!first) return null;

    const genres: string[] = (first.genres || []).map((g: any) => g.name);
    if (first.tags) {
      for (const t of first.tags) {
        if (!genres.includes(t.name) && t.count > 0) {
          genres.push(t.name);
        }
      }
    }

    return {
      mbid: first.id,
      name: first.name,
      disambiguation: first.disambiguation,
      type: first.type,
      country: first.country,
      genres: genres.slice(0, 8),
    };
  } catch (err) {
    return null;
  }
}
