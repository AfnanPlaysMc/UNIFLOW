import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
//@ts-ignore
import ytSearch from 'yt-search';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for JSON
app.use(express.json());

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

// YouTube search endpoint for full-length song streams
app.get('/api/youtube/search', async (req: Request, res: Response): Promise<void> => {
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
});

// Allowed external API hostnames for the proxy
const ALLOWED_HOSTS = new Set([
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

// Helper to check if domain or subdomain is allowed
function isAllowedHost(hostname: string): boolean {
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

// In-memory simple TTL cache for proxied requests
interface CacheEntry {
  data: any;
  contentType: string;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Centralized Secure API Proxy endpoint
app.get('/api/proxy', async (req: Request, res: Response): Promise<void> => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).json({ error: 'Missing target "url" query parameter' });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    res.status(400).json({ error: 'Invalid URL supplied' });
    return;
  }

  if (!isAllowedHost(parsed.hostname)) {
    res.status(403).json({ error: `Host "${parsed.hostname}" is not permitted on this proxy.` });
    return;
  }

  // Check cache
  const cached = cache.get(targetUrl);
  if (cached && cached.expiresAt > Date.now()) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('X-Cache', 'HIT');
    res.send(cached.data);
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const headers: Record<string, string> = {
      'User-Agent': 'WaveformMusicApp/1.0.0 (https://waveform.app; contact@waveform.app)',
      'Accept': 'application/json, text/plain, */*',
    };

    const fetchResponse = await fetch(targetUrl, {
      signal: controller.signal,
      headers,
    });
    clearTimeout(timeout);

    const contentType = fetchResponse.headers.get('content-type') || 'application/json';
    const textData = await fetchResponse.text();

    res.status(fetchResponse.status);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=60');

    if (fetchResponse.ok) {
      cache.set(targetUrl, {
        data: textData,
        contentType,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      // Purge oldest cache entries if too large
      if (cache.size > 500) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
      }
    }

    res.send(textData);
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    res.status(isTimeout ? 504 : 502).json({
      error: isTimeout ? 'Gateway Timeout' : 'Bad Gateway',
      message: err.message || 'Error communicating with external music API',
    });
  }
});

async function resolveAudioDownloadUrl(
  title?: string,
  artist?: string,
  videoId?: string,
  rawUrl?: string
): Promise<string | null> {
  // 1. If rawUrl is a direct MP3 audio file URL (Audius, Deezer, etc.), use it directly
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

  // 2. Search Audius 320kbps full MP3 catalog
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

  // 3. Search Deezer preview stream
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

  // 4. Invidious itag 140
  if (videoId) {
    const mirrors = [
      'https://inv.privacydev.net',
      'https://invidious.projectsegfau.lt',
      'https://invidious.drgns.space',
    ];
    for (const m of mirrors) {
      try {
        const u = `${m}/latest_version?id=${videoId}&itag=140`;
        const res = await fetch(u, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
        if (res.status === 200 || res.status === 206) return u;
      } catch {}
    }
  }

  return rawUrl || null;
}

// Audio Download endpoint that streams real full MP3 files to device
app.get('/api/download', async (req: Request, res: Response): Promise<void> => {
  const fileUrl = req.query.url as string;
  const title = req.query.title as string;
  const artist = req.query.artist as string;
  const videoId = req.query.videoId as string;
  const fileName = (req.query.filename as string) || `${artist || 'Track'} - ${title || 'Audio'}.mp3`;

  try {
    let targetAudioUrl: string | null = null;

    // Direct stream logic for YouTube
    if (videoId && (fileUrl.includes('youtube.com') || fileUrl.includes('embed'))) {
      // Try Invidious itag 140
      const mirrors = [
        'https://inv.privacydev.net',
        'https://invidious.projectsegfau.lt',
        'https://invidious.drgns.space',
      ];
      for (const m of mirrors) {
        try {
          const u = `${m}/latest_version?id=${videoId}&itag=140`;
          const res = await fetch(u, { method: 'HEAD', signal: AbortSignal.timeout(3000), redirect: 'follow' });
          if (res.status === 200 || res.status === 206) {
            targetAudioUrl = u;
            break;
          }
        } catch {}
      }
    }

    // Fallback: Audius Search
    if (!targetAudioUrl) {
      const query = `${title || ''} ${artist || ''}`.trim();
      if (query) {
        try {
          const audiusRes = await fetch(
            `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=WAVEFORM&limit=2`,
            { signal: AbortSignal.timeout(4000) }
          );
          if (audiusRes.ok) {
            const data = await audiusRes.json();
            const track = data.data?.[0];
            if (track?.stream?.url) {
              targetAudioUrl = track.stream.url;
            }
          }
        } catch {}
      }
    }

    // Fallback: Use original provided URL if it looks like an audio file
    if (!targetAudioUrl && fileUrl && (fileUrl.includes('.mp3') || fileUrl.includes('dzcdn.net'))) {
      targetAudioUrl = fileUrl;
    }

    if (!targetAudioUrl) {
      res.status(400).send('Unable to locate valid audio stream for download');
      return;
    }

    let response = await fetch(targetAudioUrl, { redirect: 'follow' });
    if (!response.ok) {
      res.status(response.status).send(`Failed to stream audio file: ${response.statusText}`);
      return;
    }

    const safeFilename = fileName.endsWith('.mp3') ? fileName : `${fileName}.mp3`;
    const cleanedName = safeFilename.replace(/[/\\?%*:|"<>]/g, '_');

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanedName)}"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const contentLength = response.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    if (response.body) {
      const { Readable } = await import('stream');
      // @ts-ignore
      const nodeStream = Readable.fromWeb(response.body);
      nodeStream.pipe(res);
    } else {
      res.status(500).send('Audio stream body is empty');
    }
  } catch (err: any) {
    res.status(500).send(`Audio download streaming failed: ${err.message}`);
  }
});

// Audio streaming proxy endpoint supporting HTTP Range (206 Partial Content)
app.get('/api/stream', async (req: Request, res: Response): Promise<void> => {
  const fileUrl = req.query.url as string;
  if (!fileUrl) {
    res.status(400).send('Missing audio URL parameter');
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(fileUrl);
  } catch {
    res.status(400).send('Invalid audio URL');
    return;
  }

  if (!isAllowedHost(parsed.hostname)) {
    res.status(403).send(`Host "${parsed.hostname}" is not allowed`);
    return;
  }

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
    };
    if (req.headers.range) {
      headers['Range'] = req.headers.range as string;
    }

    const response = await fetch(fileUrl, { headers });
    res.status(response.status);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Accept-Ranges', 'bytes');

    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    res.setHeader('Content-Type', contentType);

    const contentRange = response.headers.get('content-range');
    if (contentRange) res.setHeader('Content-Range', contentRange);

    const contentLength = response.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    if (response.body) {
      const { Readable } = await import('stream');
      // @ts-ignore
      const nodeStream = Readable.fromWeb(response.body);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    res.status(502).send(`Audio stream failed: ${err.message}`);
  }
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[WAVEFORM Server] listening on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
  });
}

main().catch((err) => {
  console.error('[WAVEFORM Server] Startup failure:', err);
  process.exit(1);
});
