import { LyricsData, LyricLine } from '../types';
import { fetchProxiedJson } from './proxyClient';

const LRCLIB_BASE = 'https://lrclib.net/api';

/**
 * Parses raw LRC formatted string into an array of LyricLine objects
 * Example line: [01:23.45] Hello world
 */
export function parseLrcLyrics(lrcText: string): LyricLine[] {
  if (!lrcText) return [];
  const lines = lrcText.split(/\r?\n/);
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    timeRegex.lastIndex = 0;
    const matches: { time: number }[] = [];
    let match: RegExpExecArray | null;

    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const frac = match[3]
        ? match[3].length === 2
          ? parseInt(match[3], 10) / 100
          : parseInt(match[3], 10) / 1000
        : 0;
      matches.push({ time: minutes * 60 + seconds + frac });
    }

    if (matches.length > 0) {
      const text = trimmed.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
      for (const m of matches) {
        result.push({ time: m.time, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

/**
 * Cleans track titles and artist names to maximize LRCLIB lookup match rates
 */
export function cleanMetadataForLyrics(title: string, artist: string): { title: string; artist: string } {
  let cleanTitle = title
    .replace(/\s*\([^)]*(?:official|video|audio|visualizer|lyric|remaster|edit|bonus|single|deluxe|version)[^)]*\)/gi, '')
    .replace(/\s*\[[^\]]*(?:official|video|audio|visualizer|lyric|remaster|edit|bonus|single|deluxe|version)[^\]]*\]/gi, '')
    .replace(/\s*\((?:feat\.|ft\.).*?\)/gi, '')
    .replace(/\s*\[(?:feat\.|ft\.).*?\]/gi, '')
    .replace(/\s*-(?:\s*single|\s*ep|\s*remastered|\s*radio edit|\s*bonus track|\s*original mix)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If cleaning wiped out the title, fallback to original
  if (!cleanTitle) cleanTitle = title.trim();

  let cleanArtist = artist
    .replace(/\s*(?:feat\.|ft\.).*$/gi, '')
    .split(/[,/&]/)[0]
    .trim();

  if (!cleanArtist) cleanArtist = artist.trim();

  return { title: cleanTitle, artist: cleanArtist };
}

export async function fetchLyrics(
  trackTitle: string,
  artistName: string,
  _duration?: number
): Promise<LyricsData | null> {
  const { title: cleanTitle, artist: cleanArtist } = cleanMetadataForLyrics(trackTitle, artistName);

  // Strategy 1: Direct exact match (without strict duration constraint)
  try {
    const params = new URLSearchParams({
      artist_name: cleanArtist,
      track_name: cleanTitle,
    });
    const res = await fetchProxiedJson<any>(`${LRCLIB_BASE}/get?${params.toString()}`, {
      cacheTtl: 300000,
    });
    if (res && (res.syncedLyrics || res.plainLyrics)) {
      const lines = res.syncedLyrics ? parseLrcLyrics(res.syncedLyrics) : [];
      return {
        synced: lines.length > 0,
        lines,
        plainText: res.plainLyrics || undefined,
        provider: 'LRCLIB',
      };
    }
  } catch {}

  // Strategy 2: Param-based search with track_name and artist_name
  try {
    const searchUrl = `${LRCLIB_BASE}/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    const searchRes = await fetchProxiedJson<any[]>(searchUrl, { cacheTtl: 300000 });
    if (Array.isArray(searchRes) && searchRes.length > 0) {
      const best = searchRes.find((item) => item.syncedLyrics) || searchRes[0];
      const lines = best.syncedLyrics ? parseLrcLyrics(best.syncedLyrics) : [];
      if (lines.length > 0 || best.plainLyrics) {
        return {
          synced: lines.length > 0,
          lines,
          plainText: best.plainLyrics || undefined,
          provider: 'LRCLIB',
        };
      }
    }
  } catch {}

  // Strategy 3: General query search (title + artist)
  try {
    const generalUrl = `${LRCLIB_BASE}/search?q=${encodeURIComponent(`${cleanTitle} ${cleanArtist}`)}`;
    const generalRes = await fetchProxiedJson<any[]>(generalUrl, { cacheTtl: 300000 });
    if (Array.isArray(generalRes) && generalRes.length > 0) {
      const best = generalRes.find((item) => item.syncedLyrics) || generalRes[0];
      const lines = best.syncedLyrics ? parseLrcLyrics(best.syncedLyrics) : [];
      if (lines.length > 0 || best.plainLyrics) {
        return {
          synced: lines.length > 0,
          lines,
          plainText: best.plainLyrics || undefined,
          provider: 'LRCLIB',
        };
      }
    }
  } catch {}

  // Strategy 4: Broad query search by title only
  try {
    const titleOnlyUrl = `${LRCLIB_BASE}/search?q=${encodeURIComponent(cleanTitle)}`;
    const titleRes = await fetchProxiedJson<any[]>(titleOnlyUrl, { cacheTtl: 300000 });
    if (Array.isArray(titleRes) && titleRes.length > 0) {
      const best = titleRes.find((item) => item.syncedLyrics) || titleRes[0];
      const lines = best.syncedLyrics ? parseLrcLyrics(best.syncedLyrics) : [];
      if (lines.length > 0 || best.plainLyrics) {
        return {
          synced: lines.length > 0,
          lines,
          plainText: best.plainLyrics || undefined,
          provider: 'LRCLIB',
        };
      }
    }
  } catch {}

  return null;
}
