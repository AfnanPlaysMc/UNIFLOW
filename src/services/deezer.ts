import { Track, Artist, Album } from '../types';
import { fetchProxiedJson } from './proxyClient';

const BASE_URL = 'https://api.deezer.com';

function mapDeezerTrack(d: any): Track {
  return {
    id: `dz_${d.id}`,
    title: d.title_short || d.title || 'Unknown Title',
    artist: d.artist?.name || 'Unknown Artist',
    artistId: d.artist?.id ? `dz_${d.artist.id}` : undefined,
    album: d.album?.title || 'Unknown Album',
    albumId: d.album?.id ? `dz_${d.album.id}` : undefined,
    artwork: d.album?.cover_big || d.album?.cover_medium || d.album?.cover || d.artist?.picture_medium || '',
    duration: d.duration || 30,
    previewUrl: d.preview || '',
    streamUrl: d.preview || '',
    source: 'deezer',
    isFullLength: false, // Deezer preview streams are 30s
    explicit: d.explicit_lyrics || false,
    rank: d.rank,
  };
}

export async function getDeezerChartTracks(limit = 20): Promise<Track[]> {
  const url = `${BASE_URL}/chart/0/tracks?limit=${limit}`;
  const res = await fetchProxiedJson<{ data: any[] }>(url);
  return (res.data || []).map(mapDeezerTrack);
}

const WORLD_FAMOUS_ARTISTS: Artist[] = [
  {
    id: 'dz_12246',
    name: 'Taylor Swift',
    picture: 'https://cdn-images.dzcdn.net/images/artist/cc2495870fe1a792ad0cdb05501ad5ec/1000x1000-000000-80-0-0.jpg',
    pictureBig: 'https://cdn-images.dzcdn.net/images/artist/cc2495870fe1a792ad0cdb05501ad5ec/1000x1000-000000-80-0-0.jpg',
    nbFans: 12765124,
  },
  {
    id: 'dz_4050205',
    name: 'The Weeknd',
    picture: 'https://cdn-images.dzcdn.net/images/artist/581693b4724a7fcfa754455101e13a44/1000x1000-000000-80-0-0.jpg',
    pictureBig: 'https://cdn-images.dzcdn.net/images/artist/581693b4724a7fcfa754455101e13a44/1000x1000-000000-80-0-0.jpg',
    nbFans: 14770932,
  },
  {
    id: 'dz_288166',
    name: 'Drake',
    picture: 'https://cdn-images.dzcdn.net/images/artist/70223888f501f4b843142e071abda364/1000x1000-000000-80-0-0.jpg',
    pictureBig: 'https://cdn-images.dzcdn.net/images/artist/70223888f501f4b843142e071abda364/1000x1000-000000-80-0-0.jpg',
    nbFans: 11000000,
  },
  {
    id: 'dz_9635624',
    name: 'Billie Eilish',
    picture: 'https://cdn-images.dzcdn.net/images/artist/8eab1a9a644889aabaca1e193e05f984/1000x1000-000000-80-0-0.jpg',
    pictureBig: 'https://cdn-images.dzcdn.net/images/artist/8eab1a9a644889aabaca1e193e05f984/1000x1000-000000-80-0-0.jpg',
    nbFans: 9291571,
  },
  {
    id: 'dz_429675',
    name: 'Bruno Mars',
    picture: 'https://cdn-images.dzcdn.net/images/artist/90f0b5b11df4f87ee878f38569b5995b/1000x1000-000000-80-0-0.jpg',
    pictureBig: 'https://cdn-images.dzcdn.net/images/artist/90f0b5b11df4f87ee878f38569b5995b/1000x1000-000000-80-0-0.jpg',
    nbFans: 12845980,
  },
  {
    id: 'dz_384236',
    name: 'Ed Sheeran',
    picture: 'https://cdn-images.dzcdn.net/images/artist/d6bb84390641d8ae9118228d9544e53d/1000x1000-000000-80-0-0.jpg',
    pictureBig: 'https://cdn-images.dzcdn.net/images/artist/d6bb84390641d8ae9118228d9544e53d/1000x1000-000000-80-0-0.jpg',
    nbFans: 20951961,
  },
  {
    id: 'dz_7543848',
    name: 'Post Malone',
    picture: 'https://cdn-images.dzcdn.net/images/artist/a5a8cca44e7eab2db7d44e039bed2574/1000x1000-000000-80-0-0.jpg',
    pictureBig: 'https://cdn-images.dzcdn.net/images/artist/a5a8cca44e7eab2db7d44e039bed2574/1000x1000-000000-80-0-0.jpg',
    nbFans: 4215700,
  },
  {
    id: 'dz_14499793',
    name: 'Shubh',
    picture: 'https://cdn-images.dzcdn.net/images/artist/66c1e15679704beb01c912eb6668de14/1000x1000-000000-80-0-0.jpg',
    pictureBig: 'https://cdn-images.dzcdn.net/images/artist/66c1e15679704beb01c912eb6668de14/1000x1000-000000-80-0-0.jpg',
    nbFans: 16132,
  },
  {
    id: 'dz_10583405',
    name: 'Bad Bunny',
    picture: 'https://cdn-images.dzcdn.net/images/artist/044a3f315b041864887a8dd8709e6926/1000x1000-000000-80-0-0.jpg',
    pictureBig: 'https://cdn-images.dzcdn.net/images/artist/044a3f315b041864887a8dd8709e6926/1000x1000-000000-80-0-0.jpg',
    nbFans: 8061034,
  },
  {
    id: 'dz_892',
    name: 'Coldplay',
    picture: 'https://cdn-images.dzcdn.net/images/artist/3087954bca22f306324912e5ac8375c3/1000x1000-000000-80-0-0.jpg',
    pictureBig: 'https://cdn-images.dzcdn.net/images/artist/3087954bca22f306324912e5ac8375c3/1000x1000-000000-80-0-0.jpg',
    nbFans: 18440607,
  },
  {
    id: 'dz_13',
    name: 'Eminem',
    picture: 'https://cdn-images.dzcdn.net/images/artist/0f30bbd33a680030054af004d698d6ac/1000x1000-000000-80-0-0.jpg',
    pictureBig: 'https://cdn-images.dzcdn.net/images/artist/0f30bbd33a680030054af004d698d6ac/1000x1000-000000-80-0-0.jpg',
    nbFans: 19163256,
  },
  {
    id: 'dz_1562681',
    name: 'Ariana Grande',
    picture: 'https://cdn-images.dzcdn.net/images/artist/721d8fab84b315502de422b8d0901509/1000x1000-000000-80-0-0.jpg',
    pictureBig: 'https://cdn-images.dzcdn.net/images/artist/721d8fab84b315502de422b8d0901509/1000x1000-000000-80-0-0.jpg',
    nbFans: 13458805,
  },
];

export async function getDeezerChartArtists(limit = 10): Promise<Artist[]> {
  try {
    const url = `${BASE_URL}/chart/0/artists?limit=15`;
    const res = await fetchProxiedJson<{ data: any[] }>(url);
    const chartList = (res.data || []).map((a: any) => ({
      id: `dz_${a.id}`,
      name: a.name,
      picture: a.picture_xl || a.picture_big || a.picture_medium || '',
      pictureBig: a.picture_xl || a.picture_big || a.picture_medium || '',
      nbFans: a.nb_fan,
    }));

    const combined = [...WORLD_FAMOUS_ARTISTS, ...chartList];
    const seen = new Set<string>();
    const unique: Artist[] = [];
    for (const a of combined) {
      if (!seen.has(a.name.toLowerCase())) {
        seen.add(a.name.toLowerCase());
        unique.push(a);
      }
    }
    return unique.slice(0, limit);
  } catch (err) {
    return WORLD_FAMOUS_ARTISTS.slice(0, limit);
  }
}

export async function getDeezerChartAlbums(limit = 10): Promise<Album[]> {
  const url = `${BASE_URL}/chart/0/albums?limit=${limit}`;
  const res = await fetchProxiedJson<{ data: any[] }>(url);
  return (res.data || []).map((al: any) => ({
    id: `dz_${al.id}`,
    title: al.title,
    cover: al.cover_medium || al.cover || '',
    coverBig: al.cover_xl || al.cover_big || '',
    artist: al.artist?.name || 'Unknown',
    artistId: al.artist?.id ? `dz_${al.artist.id}` : undefined,
  }));
}

export async function getDeezerNewReleases(limit = 10): Promise<Album[]> {
  const url = `${BASE_URL}/chart/0/albums?limit=${limit}`;
  const res = await fetchProxiedJson<{ data: any[] }>(url);
  return (res.data || []).map((al: any) => ({
    id: `dz_${al.id}`,
    title: al.title,
    cover: al.cover_medium || al.cover || '',
    coverBig: al.cover_xl || al.cover_big || '',
    artist: al.artist?.name || 'Unknown',
    artistId: al.artist?.id ? `dz_${al.artist.id}` : undefined,
  }));
}

export async function searchDeezer(query: string, limit = 25): Promise<{
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
}> {
  if (!query.trim()) return { tracks: [], artists: [], albums: [] };
  const encoded = encodeURIComponent(query.trim());

  const [tracksRes, artistsRes, albumsRes] = await Promise.allSettled([
    fetchProxiedJson<{ data: any[] }>(`${BASE_URL}/search?q=${encoded}&limit=${limit}`),
    fetchProxiedJson<{ data: any[] }>(`${BASE_URL}/search/artist?q=${encoded}&limit=8`),
    fetchProxiedJson<{ data: any[] }>(`${BASE_URL}/search/album?q=${encoded}&limit=8`),
  ]);

  const tracks = tracksRes.status === 'fulfilled' && tracksRes.value.data
    ? tracksRes.value.data.map(mapDeezerTrack)
    : [];

  const artists = artistsRes.status === 'fulfilled' && artistsRes.value.data
    ? artistsRes.value.data.map((a: any) => ({
        id: `dz_${a.id}`,
        name: a.name,
        picture: a.picture_medium || a.picture || '',
        pictureBig: a.picture_xl || a.picture_big || '',
        nbFans: a.nb_fan,
      }))
    : [];

  const albums = albumsRes.status === 'fulfilled' && albumsRes.value.data
    ? albumsRes.value.data.map((al: any) => ({
        id: `dz_${al.id}`,
        title: al.title,
        cover: al.cover_medium || al.cover || '',
        coverBig: al.cover_xl || al.cover_big || '',
        artist: al.artist?.name || 'Unknown',
        artistId: al.artist?.id ? `dz_${al.artist.id}` : undefined,
      }))
    : [];

  return { tracks, artists, albums };
}

export async function getDeezerArtist(rawId: string): Promise<{
  artist: Artist;
  topTracks: Track[];
  albums: Album[];
}> {
  const id = rawId.replace('dz_', '');
  const [infoRes, topRes, albumsRes] = await Promise.allSettled([
    fetchProxiedJson<any>(`${BASE_URL}/artist/${id}`),
    fetchProxiedJson<{ data: any[] }>(`${BASE_URL}/artist/${id}/top?limit=25`),
    fetchProxiedJson<{ data: any[] }>(`${BASE_URL}/artist/${id}/albums?limit=20`),
  ]);

  const info = infoRes.status === 'fulfilled' ? infoRes.value : null;
  const artist: Artist = {
    id: `dz_${id}`,
    name: info?.name || 'Artist',
    picture: info?.picture_medium || '',
    pictureBig: info?.picture_xl || info?.picture_big || '',
    nbFans: info?.nb_fan,
    nbAlbums: info?.nb_album,
  };

  const topTracks = topRes.status === 'fulfilled' && topRes.value.data
    ? topRes.value.data.map(mapDeezerTrack)
    : [];

  const albums = albumsRes.status === 'fulfilled' && albumsRes.value.data
    ? albumsRes.value.data.map((al: any) => ({
        id: `dz_${al.id}`,
        title: al.title,
        cover: al.cover_medium || al.cover || '',
        coverBig: al.cover_xl || al.cover_big || '',
        artist: artist.name,
        artistId: artist.id,
        releaseDate: al.release_date,
      }))
    : [];

  return { artist, topTracks, albums };
}

export async function getDeezerAlbum(rawId: string): Promise<{
  album: Album;
  tracks: Track[];
}> {
  const id = rawId.replace('dz_', '');
  const data = await fetchProxiedJson<any>(`${BASE_URL}/album/${id}`);

  const album: Album = {
    id: `dz_${id}`,
    title: data.title || 'Unknown Album',
    cover: data.cover_medium || data.cover || '',
    coverBig: data.cover_xl || data.cover_big || '',
    artist: data.artist?.name || 'Unknown Artist',
    artistId: data.artist?.id ? `dz_${data.artist.id}` : undefined,
    releaseDate: data.release_date,
    trackCount: data.nb_tracks,
    duration: data.duration,
    genre: data.genres?.data?.[0]?.name,
  };

  const tracks: Track[] = (data.tracks?.data || []).map((t: any) => ({
    id: `dz_${t.id}`,
    title: t.title_short || t.title,
    artist: t.artist?.name || album.artist,
    artistId: t.artist?.id ? `dz_${t.artist.id}` : album.artistId,
    album: album.title,
    albumId: album.id,
    artwork: album.coverBig || album.cover,
    duration: t.duration || 30,
    previewUrl: t.preview,
    streamUrl: t.preview,
    source: 'deezer',
    isFullLength: false,
    explicit: t.explicit_lyrics,
    rank: t.rank,
  }));

  return { album, tracks };
}
