import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// Import handlers from the library
import { NON_MUSIC_REGEX, cleanYouTubeTitle, isAllowedHost } from './lib/apiHandlers';
// @ts-ignore
import ytSearch from 'yt-search';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// YouTube search endpoint
app.get('/api/youtube/search', async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q) return res.status(400).json({ error: 'Missing query parameter q' });
  
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

    res.json({ data: filtered });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy endpoint
app.get('/api/proxy', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) return res.status(400).json({ error: 'Missing url' });

  let parsed: URL;
  try { parsed = new URL(targetUrl); } catch { return res.status(400).json({ error: 'Invalid URL' }); }

  if (!isAllowedHost(parsed.hostname)) return res.status(403).json({ error: 'Host not permitted' });

  try {
    const fetchResponse = await fetch(targetUrl);
    const contentType = fetchResponse.headers.get('content-type') || 'application/json';
    const textData = await fetchResponse.text();
    res.status(fetchResponse.status).setHeader('Content-Type', contentType).send(textData);
  } catch (err: any) {
    res.status(502).json({ error: 'Bad Gateway', message: err.message });
  }
});

// Audio Download endpoint
app.get('/api/download', async (req: Request, res: Response) => {
  const fileUrl = req.query.url as string;
  const title = req.query.title as string;
  const artist = req.query.artist as string;
  const videoId = req.query.videoId as string;
  const fileName = (req.query.filename as string) || `${artist || 'Track'} - ${title || 'Audio'}.mp3`;

  try {
    // In dev, we can just use the resolution function directly
    const { resolveAudioDownloadUrl } = await import('./lib/apiHandlers');
    let targetAudioUrl = await resolveAudioDownloadUrl(title, artist, videoId, fileUrl);
    
    if (!targetAudioUrl) return res.status(400).send('Unable to locate audio stream');

    const response = await fetch(targetAudioUrl, { redirect: 'follow' });
    if (!response.ok) return res.status(response.status).send(`Failed to stream: ${response.statusText}`);

    const cleanedName = fileName.replace(/[/\\?%*:|"<>]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanedName)}"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    const contentLength = response.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    if (response.body) {
      // @ts-ignore
      const nodeStream = Readable.fromWeb(response.body);
      nodeStream.pipe(res);
    } else {
      res.status(500).send('Audio stream body is empty');
    }
  } catch (err: any) {
    res.status(500).send(`Audio download failed: ${err.message}`);
  }
});

// Vite Server Setup
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  app.use('*', async (req, res) => {
    const template = await vite.transformIndexHtml(req.originalUrl, '<html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>');
    res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
  });
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}

import { Readable } from 'stream';
startServer();
