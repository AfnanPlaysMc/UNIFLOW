import { Request, Response } from 'express';
// @ts-ignore
import ytSearch from 'yt-search';

export const NON_MUSIC_REGEX = /\b(reaction|reacting|gameplay|vlog|review|tutorial|how\s*to|unboxing|podcast|minecraft|roblox|fortnite|interview|trailer|episode|talk\s*show|funny\s*moments|compilation|commentary|tier\s*list|shorts|tiktok|speedrun|playthrough|walkthrough|lets\s*play|highlight|mod|asmr)\b/i;

export const ALLOWED_HOSTS = new Set([
  'api.deezer.com',
  'itunes.apple.com',
  'musicbrainz.org',
  'api.audius.co',
  'audius-discovery-1.cultur3stake.com',
  'audius-dp.singapore.creatorseed.com',
  'discoveryprovider.audius.co',
  'lrclib.net',
  'en.wikipedia.org',
]);

export function isAllowedHost(hostname: string): boolean {
  if (ALLOWED_HOSTS.has(hostname)) return true;
  if (
    hostname.endsWith('.audius.co') ||
    hostname.endsWith('.creatorseed.com') ||
    hostname.endsWith('.dzcdn.net') ||
    hostname.endsWith('.deezer.com') ||
    hostname.endsWith('.apple.com') ||
    hostname.endsWith('.mzstatic.com')
  ) return true;
  return false;
}

export function cleanYouTubeTitle(rawTitle: string): { title: string; artist: string } {
  let clean = rawTitle
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\|.*/g, '')
    .replace(/\b(official\s*(music\s*)?video|official\s*audio|lyric\s*video|audio|hd|4k)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  let artist = 'YouTube Artist';
  let title = clean;

  if (clean.includes(' - ')) {
    const parts = clean.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }

  return { title: title || rawTitle, artist };
}

export async function resolveAudioDownloadUrl(
  title?: string,
  artist?: string,
  videoId?: string,
  rawUrl?: string
): Promise<string | null> {
  if (
    rawUrl &&
    !rawUrl.includes('youtube.com/embed') &&
    !rawUrl.includes('youtube.com/watch') &&
    (rawUrl.includes('.mp3') ||
      rawUrl.includes('.m4a') ||
      rawUrl.includes('audius.co') ||
      rawUrl.includes('dzcdn.net') ||
      rawUrl.includes('deezer.com'))
  ) {
    return rawUrl;
  }

  const query = `${title || ''} ${artist || ''}`.trim();

  if (query) {
    try {
      const audiusRes = await fetch(
        `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=WAVEFORM&limit=4`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (audiusRes.ok) {
        const data = await audiusRes.json();
        const valid = (data.data || []).filter((t: any) => !t.is_delete && t.is_streamable !== false);
        if (valid.length > 0) {
          return `https://api.audius.co/v1/tracks/${valid[0].id}/stream?app_name=WAVEFORM`;
        }
      }
    } catch {}
  }

  if (query) {
    try {
      const dzRes = await fetch(
        `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=3`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (dzRes.ok) {
        const data = await dzRes.json();
        if (data.data && data.data.length > 0 && data.data[0].preview) {
          return data.data[0].preview;
        }
      }
    } catch {}
  }

  if (videoId) {
    const mirrors = [
      'https://inv.privacydev.net',
      'https://invidious.projectsegfau.lt',
      'https://invidious.drgns.space',
    ];
    for (const m of mirrors) {
      try {
        const u = `${m}/latest_version?id=${videoId}&itag=140`;
        const res = await fetch(u, { method: 'HEAD', signal: AbortSignal.timeout(3000), redirect: 'follow' });
        if (res.status === 200 || res.status === 206) return u;
      } catch {}
    }
  }

  return rawUrl || null;
}
