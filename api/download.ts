import { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAudioDownloadUrl } from '../lib/apiHandlers';
import { Readable } from 'stream';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const fileUrl = req.query.url as string;
  const title = req.query.title as string;
  const artist = req.query.artist as string;
  const videoId = req.query.videoId as string;
  const fileName = (req.query.filename as string) || `${artist || 'Track'} - ${title || 'Audio'}.mp3`;

  try {
    let targetAudioUrl: string | null = null;

    // Direct stream logic for YouTube
    if (videoId && (fileUrl.includes('youtube.com') || fileUrl.includes('embed'))) {
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
      // @ts-ignore
      const nodeStream = Readable.fromWeb(response.body);
      nodeStream.pipe(res);
    } else {
      res.status(500).send('Audio stream body is empty');
    }
  } catch (err: any) {
    res.status(500).send(`Audio download streaming failed: ${err.message}`);
  }
}
