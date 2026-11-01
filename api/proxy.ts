import { VercelRequest, VercelResponse } from '@vercel/node';
import { isAllowedHost } from '../lib/apiHandlers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    res.send(textData);
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    res.status(isTimeout ? 504 : 502).json({
      error: isTimeout ? 'Gateway Timeout' : 'Bad Gateway',
      message: err.message || 'Error communicating with external music API',
    });
  }
}
