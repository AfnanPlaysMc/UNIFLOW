import { VercelRequest, VercelResponse } from '@vercel/node';

// Shared Utilities (Inlined for Vercel portability)
const ALLOWED_HOSTS = new Set([
  'api.deezer.com',
  'musicbrainz.org',
  'api.audius.co',
  'audius-discovery-1.cultur3stake.com',
  'audius-dp.singapore.creatorseed.com',
  'discoveryprovider.audius.co',
  'lrclib.net',
  'en.wikipedia.org',
]);

function isAllowedHost(hostname: string): boolean {
  if (ALLOWED_HOSTS.has(hostname)) return true;
  if (
    hostname.endsWith('.audius.co') ||
    hostname.endsWith('.creatorseed.com') ||
    hostname.endsWith('.dzcdn.net') ||
    hostname.endsWith('.deezer.com')
  ) return true;
  return false;
}

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
    const headers: Record<string, string> = {
      'User-Agent': 'WaveformMusicApp/1.0.0 (https://waveform.app; contact@waveform.app)',
      'Accept': 'application/json, text/plain, */*',
    };

    const fetchResponse = await fetch(targetUrl, {
      headers,
    });

    const contentType = fetchResponse.headers.get('content-type') || 'application/json';
    const textData = await fetchResponse.text();

    res.status(fetchResponse.status);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate');

    res.send(textData);
  } catch (err: any) {
    res.status(502).json({
      error: 'Bad Gateway',
      message: err.message || 'Error communicating with external music API',
    });
  }
}
