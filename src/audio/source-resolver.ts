import { Track, AudioSourceType } from '../types';
import { searchAudiusTracks } from '../services/audius';
import { searchYouTubeTracks } from '../services/youtube';

export interface ResolvedAudioSource {
  streamUrl: string;
  source: AudioSourceType;
  isFullLength: boolean;
  confidence: number;
  videoId?: string;
}

/**
 * Calculates string similarity using Jaccard token index
 */
export function calculateTextSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

  const setA = new Set(normalize(a));
  const setB = new Set(normalize(b));

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }

  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

/**
 * Evaluates whether a candidate track matches a requested track
 */
export function evaluateCandidateMatch(requested: Track, candidate: Track): number {
  const norm = (s: string) => (s || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const reqTitle = norm(requested.title);
  const reqArtist = norm(requested.artist);
  const candTitle = norm(candidate.title);
  const candArtist = norm(candidate.artist);

  const titleHasReqTitle = candTitle.includes(reqTitle);
  const titleHasReqArtist = candTitle.includes(reqArtist) || candArtist.includes(reqArtist);

  if (titleHasReqTitle && titleHasReqArtist) {
    let score = 0.85;
    if (requested.duration > 0 && candidate.duration > 0) {
      const diff = Math.abs(requested.duration - candidate.duration);
      if (diff < 20) score += 0.1;
    }
    return Math.min(1.0, score);
  }

  const titleSim = calculateTextSimilarity(reqTitle, candTitle);
  const artistSim = calculateTextSimilarity(reqArtist, candArtist);

  if (titleSim < 0.3 && !titleHasReqTitle) return 0;

  let score = titleSim * 0.6 + (titleHasReqArtist ? 0.35 : artistSim * 0.4);

  if (requested.duration > 0 && candidate.duration > 0) {
    const diff = Math.abs(requested.duration - candidate.duration);
    if (diff < 15) score += 0.15;
    else if (diff > 90) score -= 0.15;
  }

  if (candidate.duration >= 60) {
    score += 0.05;
  }

  return Math.max(0, Math.min(1, score));
}

export class AudioSourceResolver {
  public static getProxiedUrl(originalUrl: string): string {
    if (!originalUrl) return '';
    return `/api/stream?url=${encodeURIComponent(originalUrl)}`;
  }

  /**
   * Resolves the primary playable audio source for any track.
   * Prioritizes full-length YouTube and Audius audio tracks.
   */
  public static async resolveSource(track: Track): Promise<ResolvedAudioSource> {
    // 1. If track is already YouTube or full-length Audius with streamUrl
    if (track.source === 'youtube' && track.streamUrl) {
      return {
        streamUrl: track.streamUrl,
        source: 'youtube',
        isFullLength: true,
        confidence: 1.0,
        videoId: track.videoId,
      };
    }

    if (track.isFullLength && track.duration >= 45 && track.streamUrl) {
      return {
        streamUrl: track.streamUrl,
        source: track.source,
        isFullLength: true,
        confidence: 1.0,
      };
    }

    // 2. Prioritize searching YouTube for the full song
    try {
      const cleanTitle = track.title.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const cleanArtist = track.artist.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const ytResults = await searchYouTubeTracks(`${cleanTitle} ${cleanArtist}`, 5);

      if (ytResults.length > 0 && ytResults[0].streamUrl) {
        const best = ytResults[0];
        console.log(`[AudioSourceResolver] Resolved "${track.title}" to full YouTube song (${best.title})`);
        return {
          streamUrl: best.streamUrl || '',
          source: 'youtube',
          isFullLength: true,
          confidence: 0.95,
          videoId: best.videoId,
        };
      }
    } catch (err) {
      console.warn('[AudioSourceResolver] YouTube search resolution failed:', err);
    }

    // 3. Fallback: Search Audius decentralized catalog for full songs
    try {
      const cleanTitle = track.title.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const cleanArtist = track.artist.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const audiusResults = await searchAudiusTracks(`${cleanTitle} ${cleanArtist}`, 8);

      for (const candidate of audiusResults) {
        if (!candidate.streamUrl || candidate.duration < 45) continue;
        const score = evaluateCandidateMatch(track, candidate);
        if (score >= 0.35) {
          return {
            streamUrl: candidate.streamUrl,
            source: 'audius',
            isFullLength: true,
            confidence: score,
          };
        }
      }
    } catch (err) {}

    // 4. Direct stream / preview fallback if present
    const directUrl = track.streamUrl || track.previewUrl;
    if (directUrl) {
      return {
        streamUrl: directUrl,
        source: track.source,
        isFullLength: track.isFullLength || (track.duration ? track.duration > 45 : false),
        confidence: 0.7,
      };
    }

    // 5. Unavailable
    return {
      streamUrl: '',
      source: 'unavailable',
      isFullLength: false,
      confidence: 0,
    };
  }

  public static async resolveAlternativeSource(
    track: Track,
    failedUrls: Set<string>
  ): Promise<ResolvedAudioSource | null> {
    const cleanQuery = `${track.title} ${track.artist}`.trim();

    try {
      const ytMatches = await searchYouTubeTracks(cleanQuery, 5);
      for (const match of ytMatches) {
        if (match.streamUrl && !failedUrls.has(match.streamUrl)) {
          return {
            streamUrl: match.streamUrl,
            source: 'youtube',
            isFullLength: true,
            confidence: 0.9,
            videoId: match.videoId,
          };
        }
      }
    } catch {}

    try {
      const audiusMatches = await searchAudiusTracks(cleanQuery, 5);
      for (const match of audiusMatches) {
        if (match.streamUrl && !failedUrls.has(match.streamUrl)) {
          return {
            streamUrl: match.streamUrl,
            source: 'audius',
            isFullLength: true,
            confidence: 0.8,
          };
        }
      }
    } catch {}

    const originalUrl = track.streamUrl || track.previewUrl;
    if (originalUrl) {
      const proxied = this.getProxiedUrl(originalUrl);
      if (!failedUrls.has(proxied)) {
        return {
          streamUrl: proxied,
          source: track.source,
          isFullLength: track.isFullLength || false,
          confidence: 0.6,
        };
      }
    }

    return null;
  }
}
