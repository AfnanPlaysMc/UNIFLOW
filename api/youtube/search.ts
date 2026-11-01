import { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore
import ytSearch from 'yt-search';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query.q as string;
  if (!q) {
    res.status(400).json({ error: 'Missing query parameter q' });
    return;
  }

  try {
    // 1. Try yt-search (Primary)
    // We add 'official audio' to improve music results
    const searchQuery = q.toLowerCase().includes('song') || q.toLowerCase().includes('audio') ? q : `${q} official audio`;
    const result = await ytSearch({ query: searchQuery, hl: 'en', gl: 'US' });

    if (result && result.videos && result.videos.length > 0) {
      const filtered = result.videos
        .filter((v: any) => {
          if (NON_MUSIC_REGEX.test(v.title) || NON_MUSIC_REGEX.test(v.author?.name || '')) return false;
          const dur = v.duration?.seconds || 0;
          if (dur < 30 || dur > 900) return false;
          return true;
        })
        .slice(0, 20)
        .map((v: any) => {
          const { title, artist } = cleanYouTubeTitle(v.title);
          const resolvedArtist = v.author?.name && !v.author.name.toLowerCase().includes('vevo')
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

      if (filtered.length > 0) {
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        res.status(200).json({ data: filtered });
        return;
      }
    }

    // 2. Fallback: Search Audius via Proxy-like fetch if YouTube fails
    const audiusUrl = `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=WAVEFORM&limit=15`;
    const audiusRes = await fetch(audiusUrl);
    if (audiusRes.ok) {
      const audiusData = await audiusRes.json();
      const audiusTracks = (audiusData.data || []).map((t: any) => ({
        id: `au_${t.id}`,
        title: t.title,
        artist: t.user?.name || 'Audius Artist',
        album: 'Audius',
        artwork: t.artwork?.['480x480'] || t.artwork?.['150x150'] || '',
        duration: t.duration || 180,
        streamUrl: `https://api.audius.co/v1/tracks/${t.id}/stream?app_name=WAVEFORM`,
        source: 'audius',
        isFullLength: true,
      }));
      
      if (audiusTracks.length > 0) {
        res.status(200).json({ data: audiusTracks, source: 'audius-fallback' });
        return;
      }
    }

    // If everything fails, return empty data
    res.status(200).json({ data: [], message: 'No results found' });

  } catch (err: any) {
    console.error('YouTube Search Handler Error:', err);
    res.status(200).json({ data: [], error: err.message });
  }
}
