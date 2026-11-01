import { Track } from '../types';

export async function searchYouTubeTracks(query: string, limit = 20): Promise<Track[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query.trim())}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).slice(0, limit).map((t: any) => ({
      id: t.id || `yt_${t.videoId}`,
      title: t.title || 'YouTube Track',
      artist: t.artist || 'YouTube Artist',
      album: t.album || 'YouTube Music',
      artwork: t.artwork || `https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg`,
      duration: t.duration || 180,
      streamUrl: t.streamUrl || `https://www.youtube.com/embed/${t.videoId}?autoplay=1&enablejsapi=1`,
      previewUrl: t.streamUrl || `https://www.youtube.com/embed/${t.videoId}?autoplay=1&enablejsapi=1`,
      source: 'youtube',
      isFullLength: true,
      videoId: t.videoId,
    }));
  } catch (err) {
    console.warn('[YouTube] Search error:', err);
    return [];
  }
}
