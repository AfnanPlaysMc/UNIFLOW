import { VercelRequest, VercelResponse } from '@vercel/node';

// Shared Utilities (Inlined for Vercel portability)
const NON_MUSIC_REGEX = /\b(reaction|reacting|gameplay|vlog|review|tutorial|how\s*to|unboxing|podcast|minecraft|roblox|fortnite|interview|trailer|episode|talk\s*show|funny\s*moments|compilation|commentary|tier\s*list|shorts|tiktok|speedrun|playthrough|walkthrough|lets\s*play|highlight|mod|asmr)\b/i;

function cleanYouTubeTitle(rawTitle: string): { title: string; artist: string } {
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

const INVIDIOUS_MIRRORS = [
  'https://invidious.projectsegfau.lt',
  'https://invidious.drgns.space',
  'https://inv.privacydev.net',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query.q as string;
  if (!q) {
    res.status(400).json({ error: 'Missing query parameter q' });
    return;
  }
  
  try {
    let results: any[] = [];
    let success = false;

    const searchQuery = encodeURIComponent(q);

    for (const mirror of INVIDIOUS_MIRRORS) {
      try {
        const response = await fetch(`${mirror}/api/v1/search?q=${searchQuery}&type=video`);
        if (response.ok) {
          results = await response.json();
          success = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!success) {
      res.status(200).json({ data: [] });
      return;
    }

    const filtered = (results || [])
      .filter((v: any) => {
        if (NON_MUSIC_REGEX.test(v.title) || NON_MUSIC_REGEX.test(v.author || '')) return false;
        const dur = v.lengthSeconds || 0;
        if (dur < 30 || dur > 900) return false;
        return true;
      })
      .slice(0, 25)
      .map((v: any) => {
        const { title, artist } = cleanYouTubeTitle(v.title);
        const resolvedArtist = v.author && !v.author.toLowerCase().includes('vevo')
            ? v.author.replace(/\s*-\s*Topic$/i, '')
            : artist;

        return {
          id: `yt_${v.videoId}`,
          videoId: v.videoId,
          title: title || v.title,
          artist: resolvedArtist || 'YouTube Artist',
          album: 'YouTube Music',
          artwork: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          duration: v.lengthSeconds || 180,
          streamUrl: `https://www.youtube.com/embed/${v.videoId}?autoplay=1&enablejsapi=1`,
          source: 'youtube' as const,
          isFullLength: true,
        };
      });

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json({ data: filtered });
  } catch (err: any) {
    res.status(200).json({ data: [], error: err.message });
  }
}
