import { VercelRequest, VercelResponse } from '@vercel/node';
import { isAllowedHost, NON_MUSIC_REGEX, cleanYouTubeTitle } from '../lib/apiHandlers';
// @ts-ignore
import ytSearch from 'yt-search';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query.q as string;
  if (!q) {
    res.status(400).json({ error: 'Missing query parameter q' });
    return;
  }
  try {
    const searchQuery = q.toLowerCase().includes('song') || q.toLowerCase().includes('audio') ? q : `${q} official audio song`;
    const result = await ytSearch(searchQuery);

    const filtered = (result.videos || [])
      .filter((v: any) => {
        if (NON_MUSIC_REGEX.test(v.title) || NON_MUSIC_REGEX.test(v.author?.name || '')) return false;
        const dur = v.duration?.seconds || 0;
        if (dur < 40 || dur > 720) return false;
        return true;
      })
      .slice(0, 20)
      .map((v: any) => {
        const { title, artist } = cleanYouTubeTitle(v.title);
        const resolvedArtist =
          v.author?.name && !v.author.name.toLowerCase().includes('vevo')
            ? v.author.name.replace(/\s*-\s*Topic$/i, '')
            : artist;

        return {
          id: `yt_${v.videoId}`,
          videoId: v.videoId,
          title: title || v.title,
          artist: resolvedArtist || 'YouTube Artist',
          album: 'YouTube Music',
          artwork: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          duration: v.duration?.seconds || 180,
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
