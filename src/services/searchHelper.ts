import { Track } from '../types';
import { searchDeezer, getDeezerChartTracks } from './deezer';
import { searchYouTubeTracks } from './youtube';
import { searchAudiusTracks, getAudiusTrendingTracks } from './audius';

export async function searchTracksUnified(query: string, limit = 30): Promise<Track[]> {
  const cleanTerm = query.trim();
  if (!cleanTerm) return [];

  const [dzResult, ytResult, audiusResult] = await Promise.allSettled([
    searchDeezer(cleanTerm, limit),
    searchYouTubeTracks(cleanTerm, limit),
    searchAudiusTracks(cleanTerm, limit),
  ]);

  const rawTracks: Track[] = [];

  if (dzResult.status === 'fulfilled') {
    rawTracks.push(...dzResult.value.tracks);
  }
  if (ytResult.status === 'fulfilled') {
    rawTracks.push(...ytResult.value);
  }
  if (audiusResult.status === 'fulfilled') {
    rawTracks.push(...audiusResult.value);
  }

  // Fallback broad search if results are sparse
  if (rawTracks.length < 3) {
    const simplified = cleanTerm
      .replace(/\b(by|song|audio|official|ft\.|featuring)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (simplified && simplified !== cleanTerm) {
      const [dzFb, ytFb] = await Promise.allSettled([
        searchDeezer(simplified, 25),
        searchYouTubeTracks(simplified, 25),
      ]);
      if (dzFb.status === 'fulfilled') rawTracks.push(...dzFb.value.tracks);
      if (ytFb.status === 'fulfilled') rawTracks.push(...ytFb.value);
    }
  }

  const trackMap = new Map<string, Track>();
  for (const t of rawTracks) {
    const key = `${(t.title || '').trim().toLowerCase()}_${(t.artist || '').trim().toLowerCase()}`;
    const existing = trackMap.get(key);

    if (!existing) {
      trackMap.set(key, { ...t, isFullLength: true });
    } else {
      const existingIsYt = existing.source === 'youtube';
      const newIsYt = t.source === 'youtube';
      const primary = !existingIsYt ? existing : !newIsYt ? t : existing;
      const secondary = primary === existing ? t : existing;

      trackMap.set(key, {
        ...primary,
        videoId: primary.videoId || secondary.videoId,
        streamUrl: primary.streamUrl || secondary.streamUrl,
        duration: primary.duration || secondary.duration,
        isFullLength: true,
      });
    }
  }

  return Array.from(trackMap.values()).slice(0, limit);
}

export async function getRecommendedTracksForAdd(limit = 20): Promise<Track[]> {
  const [dzChart, audiusTrending] = await Promise.allSettled([
    getDeezerChartTracks(limit),
    getAudiusTrendingTracks(limit),
  ]);

  const combined: Track[] = [];
  if (dzChart.status === 'fulfilled') {
    combined.push(...dzChart.value);
  }
  if (audiusTrending.status === 'fulfilled') {
    combined.push(...audiusTrending.value);
  }

  const seen = new Set<string>();
  const unique: Track[] = [];
  for (const t of combined) {
    const key = `${(t.title || '').trim().toLowerCase()}_${(t.artist || '').trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ ...t, isFullLength: true });
    }
  }

  return unique.slice(0, limit);
}
