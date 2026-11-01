import { VercelRequest, VercelResponse } from '@vercel/node';
import { NON_MUSIC_REGEX, cleanYouTubeTitle } from '/app/applet/lib/apiHandlers';

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

    for (const mirror of INVIDIOUS_MIRRORS) {
      try {
        const response = await fetch(`${mirror}/api/v1/search?q=${encodeURIComponent(q)}&type=video`, {
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          results = await response.json();
          success = true;
          break;
        }
      } catch (e) {
        console.warn(`Mirror ${mirror} failed, trying next...`);
      }
    }

    if (!success) {
      throw new Error('All YouTube search mirrors failed.');
    }

    const filtered = results
      .filter((v: any) => {
        if (NON_MUSIC_REGEX.test(v.title) || NON_MUSIC_REGEX.test(v.author || '')) return false;
        const dur = v.lengthSeconds || 0;
        if (dur < 40 || dur > 720) return false;
        return true;
      })
      .slice(0, 20)
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

    res.json({ data: filtered });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
