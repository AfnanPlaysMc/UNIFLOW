import { fetchProxiedJson } from './proxyClient';

export interface WikipediaArtistSummary {
  title: string;
  extract: string;
  description?: string;
  thumbnailUrl?: string;
  articleUrl?: string;
}

export async function getWikipediaArtistSummary(artistName: string): Promise<WikipediaArtistSummary | null> {
  if (!artistName || !artistName.trim()) return null;

  // Clean artist name (remove feat., brackets, trim)
  const cleanName = artistName
    .replace(/\(feat\..*?\)/i, '')
    .replace(/\[.*?\]/g, '')
    .split(',')[0]
    .split('&')[0]
    .trim()
    .replace(/\s+/g, '_');

  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`;

  try {
    const data = await fetchProxiedJson<any>(url, { cacheTtl: 86400000 }); // 24h cache
    if (!data || data.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') {
      return null;
    }

    return {
      title: data.title || artistName,
      extract: data.extract || '',
      description: data.description || 'Musical Artist',
      thumbnailUrl: data.thumbnail?.source || undefined,
      articleUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanName)}`,
    };
  } catch (err) {
    return null;
  }
}
