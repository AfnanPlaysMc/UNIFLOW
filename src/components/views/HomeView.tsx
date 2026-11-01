import React, { useEffect, useState } from 'react';
import { Track, Artist, Album } from '../../types';
import { getDeezerChartTracks, getDeezerChartArtists, getDeezerChartAlbums, getDeezerNewReleases } from '../../services/deezer';
import { getAudiusTrendingTracks } from '../../services/audius';
import { TrackItem } from '../ui/TrackItem';
import { ArtistCard } from '../ui/ArtistCard';
import { AlbumCard } from '../ui/AlbumCard';
import { TrackSkeleton, CardSkeleton } from '../ui/Skeleton';
import { Sparkles, TrendingUp, Compass, Disc3, Music2, Play } from 'lucide-react';
import { navigateToHash } from '../../utils/router';
import { useAudio } from '../../context/AudioContext';

interface HomeViewProps {
  onSelectArtist: (artist: Artist) => void;
  onSelectAlbum: (album: Album) => void;
  onSelectGenre: (genre: string) => void;
}

const OXA_LOGO = 'https://raw.githubusercontent.com/AfnanPlaysMc/GAME/main/Black%20Beige%20Minimalist%20Typographic%20Creative%20Studio%20Logo.png';

export const HomeView: React.FC<HomeViewProps> = ({ onSelectArtist, onSelectAlbum, onSelectGenre }) => {
  const { playTrack } = useAudio();
  const [chartTracks, setChartTracks] = useState<Track[]>([]);
  const [audiusTracks, setAudiusTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [newReleases, setNewReleases] = useState<Album[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    let active = true;
    async function loadHomeData() {
      setLoading(true);
      try {
        const [charts, audius, topArtists, topAlbums, newRel] = await Promise.allSettled([
          getDeezerChartTracks(10),
          getAudiusTrendingTracks(10),
          getDeezerChartArtists(10),
          getDeezerChartAlbums(5),
          getDeezerNewReleases(5),
        ]);

        if (active) {
          if (charts.status === 'fulfilled') setChartTracks(charts.value);
          if (audius.status === 'fulfilled') setAudiusTracks(audius.value);
          if (topArtists.status === 'fulfilled') setArtists(topArtists.value);
          if (topAlbums.status === 'fulfilled') setAlbums(topAlbums.value);
          if (newRel.status === 'fulfilled') setNewReleases(newRel.value);
        }
      } catch (err) {
        console.warn('Error loading home data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadHomeData();
    return () => {
      active = false;
    };
  }, []);

  const genres = ['Hip-Hop', 'Pop', 'Electronic', 'Rock', 'R&B', 'Ambient', 'Jazz', 'Classical'];

  const handleGenreClick = (genre: string) => {
    if (onSelectGenre) {
      onSelectGenre(genre);
    } else {
      navigateToHash('search', genre);
    }
  };

  const featuredTrack = chartTracks[0] || audiusTracks[0];

  return (
    <div className="space-y-12 pb-32">
      {/* Hero Banner: Large Clean Typography + Featured Song Highlight */}
      <div className="relative rounded-3xl p-8 sm:p-10 overflow-hidden bg-gradient-to-br from-blue-50/90 via-white to-slate-50 dark:from-blue-950/60 dark:via-[#0B0F19] dark:to-[#060913] border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 transition-colors">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-100/80 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-black mb-4 shadow-xs">
            <span className="w-4 h-4 rounded-full overflow-hidden inline-block border border-blue-300 dark:border-blue-700">
              <img src={OXA_LOGO} alt="OXA Studios" className="w-full h-full object-cover" />
            </span>
            <span className="uppercase tracking-wider">Vibeo by OXA Studios</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {getGreeting()}
          </h1>

          <p className="mt-3 text-slate-600 dark:text-slate-300 text-base sm:text-lg font-medium leading-relaxed">
            Discover chart-topping hits, verified discographies, synchronized lyrics, and Web Audio hardware playback.
          </p>

          {/* Quick genre filter pills */}
          <div className="flex flex-wrap gap-2.5 mt-6">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => handleGenreClick(g)}
                className="px-4 py-2 rounded-full text-sm font-bold bg-white dark:bg-slate-900 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-all shadow-xs"
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Track Card */}
        {featuredTrack && (
          <div
            onClick={() => playTrack(featuredTrack, chartTracks)}
            className="relative z-10 w-full lg:w-80 p-5 rounded-3xl bg-white dark:bg-[#0E1322] border border-slate-200/90 dark:border-slate-800 shadow-xl group cursor-pointer shrink-0 transition-all hover:border-blue-500"
          >
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 shadow-md">
              <img
                src={featuredTrack.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'}
                alt={featuredTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              <button
                aria-label={`Play ${featuredTrack.title}`}
                className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-500/40 flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </button>
              <span className="absolute left-3 top-3 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                FEATURED
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {featuredTrack.title}
            </h3>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate mt-1">
              {featuredTrack.artist}
            </p>
          </div>
        )}

        {/* Soft background blue glow */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-blue-500/10 dark:bg-blue-500/15 blur-3xl pointer-events-none" />
      </div>

      {/* Section: Trending Global Hits */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Trending Global Hits</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Top chart-ranking worldwide hits</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TrackSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(chartTracks.length > 0 ? chartTracks : audiusTracks).map((track, idx) => (
              <TrackItem
                key={track.id}
                track={track}
                index={idx}
                playlistContext={chartTracks.length > 0 ? chartTracks : audiusTracks}
                showAlbum={false}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section: New Releases */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">New Releases</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Latest albums and singles</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {newReleases.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onSelect={(al) => {
                  if (onSelectAlbum) onSelectAlbum(al);
                  else navigateToHash('album', al.id);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section: Popular Albums */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <Disc3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Popular Albums</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Complete studio albums and tracklists</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onSelect={(al) => {
                  if (onSelectAlbum) onSelectAlbum(al);
                  else navigateToHash('album', al.id);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section: Popular Artists */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900/60 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Featured Artists</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Verified discographies and biographies</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onSelect={(a) => {
                  if (onSelectArtist) onSelectArtist(a);
                  else navigateToHash('artist', a.name);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section: Full-Length Artist Streams */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
              <Music2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Full-Length Artist Streams</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Decentralized open artist audio recordings</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TrackSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {audiusTracks.map((track, idx) => (
              <TrackItem
                key={track.id}
                track={track}
                index={idx}
                playlistContext={audiusTracks}
                showAlbum={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
