import React, { useEffect, useState } from 'react';
import { Artist, Track, Album } from '../../types';
import { getDeezerArtist, searchDeezer } from '../../services/deezer';
import { lookupMusicBrainzArtist } from '../../services/musicbrainz';
import { getWikipediaArtistSummary, WikipediaArtistSummary } from '../../services/wikipedia';
import { useAudio } from '../../context/AudioContext';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { TrackItem } from '../ui/TrackItem';
import { AlbumCard } from '../ui/AlbumCard';
import { TrackSkeleton } from '../ui/Skeleton';
import { Play, Check, Plus, BadgeCheck, BookOpen, ExternalLink, LogIn, Lock, X } from 'lucide-react';
import { navigateToHash } from '../../utils/router';

interface ArtistViewProps {
  artist?: Artist | null;
  artistName?: string;
  onSelectAlbum?: (album: Album) => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({
  artist: initialArtist,
  artistName,
  onSelectAlbum,
}) => {
  const { playTrack } = useAudio();
  const { user, login } = useAuth();
  const { isFollowingArtist, toggleFollowArtist } = useLibrary();

  const [currentArtist, setCurrentArtist] = useState<Artist | null>(initialArtist || null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [verifiedGenres, setVerifiedGenres] = useState<string[]>([]);
  const [wikiSummary, setWikiSummary] = useState<WikipediaArtistSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const effectiveName = currentArtist?.name || artistName || '';
  const isFollowing = isFollowingArtist(effectiveName);

  useEffect(() => {
    let active = true;

    async function resolveAndLoad() {
      setLoading(true);

      let targetArtist = initialArtist;

      // If artist object not provided but artistName is provided, search Deezer to get artist ID & picture
      if (!targetArtist && artistName) {
        try {
          const searchRes = await searchDeezer(artistName, 4);
          if (searchRes.artists && searchRes.artists.length > 0) {
            targetArtist = searchRes.artists[0];
            if (active) setCurrentArtist(targetArtist);
          } else {
            targetArtist = {
              id: 'art_' + encodeURIComponent(artistName),
              name: artistName,
              picture: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
            };
            if (active) setCurrentArtist(targetArtist);
          }
        } catch {
          targetArtist = {
            id: 'art_' + encodeURIComponent(artistName),
            name: artistName,
            picture: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
          };
          if (active) setCurrentArtist(targetArtist);
        }
      }

      if (!targetArtist) {
        if (active) setLoading(false);
        return;
      }

      try {
        // Parallel fetch: Deezer discography, MusicBrainz verified genres, and Wikipedia biography
        const [dzData, mbData, wikiData] = await Promise.allSettled([
          getDeezerArtist(targetArtist.id),
          lookupMusicBrainzArtist(targetArtist.name),
          getWikipediaArtistSummary(targetArtist.name),
        ]);

        if (active) {
          if (dzData.status === 'fulfilled') {
            setTopTracks(dzData.value.topTracks || []);
            setAlbums(dzData.value.albums || []);
          }
          if (mbData.status === 'fulfilled' && mbData.value) {
            setVerifiedGenres(mbData.value.genres || []);
          }
          if (wikiData.status === 'fulfilled') {
            setWikiSummary(wikiData.value);
          }
        }
      } catch (err) {
        console.warn('Artist load error:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    resolveAndLoad();

    return () => {
      active = false;
    };
  }, [initialArtist, artistName]);

  const handleFollowClick = async () => {
    if (!effectiveName) return;

    // REQUIREMENT: Must be logged in to follow!
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    await toggleFollowArtist(effectiveName);
  };

  const handlePlayArtist = () => {
    if (topTracks.length > 0) {
      playTrack(topTracks[0], topTracks);
    }
  };

  const handleAlbumClick = (album: Album) => {
    if (onSelectAlbum) {
      onSelectAlbum(album);
    } else {
      navigateToHash('album', album.id);
    }
  };

  const artistAvatar =
    currentArtist?.pictureBig ||
    currentArtist?.picture ||
    wikiSummary?.thumbnailUrl ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';

  return (
    <div className="space-y-8 pb-32">
      {/* Clean White/Blue & Black/Blue Artist Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50/70 via-white to-slate-50 dark:from-blue-950/40 dark:via-[#0B0F19] dark:to-[#060913] border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 transition-colors">
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-md shrink-0 border-4 border-white dark:border-slate-800">
          <img
            src={artistAvatar}
            alt={effectiveName}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold">
            <BadgeCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Verified Musical Artist
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {effectiveName || 'Artist'}
          </h1>

          {/* Genre chips */}
          {verifiedGenres.length > 0 && (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
              {verifiedGenres.slice(0, 4).map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-center md:justify-start gap-3 pt-3 flex-wrap">
            <button
              onClick={handlePlayArtist}
              disabled={topTracks.length === 0}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              Play Artist Top Songs
            </button>

            {/* Follow Button: Requires Login */}
            <button
              onClick={handleFollowClick}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                isFollowing
                  ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title={user ? (isFollowing ? 'Click to Unfollow' : 'Click to Follow') : 'Sign in to Follow'}
            >
              {isFollowing ? (
                <>
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Following
                </>
              ) : (
                <>
                  {!user && <Lock className="w-3 h-3 text-slate-400" />}
                  <Plus className="w-3.5 h-3.5" /> Follow
                </>
              )}
            </button>

            {wikiSummary?.articleUrl && (
              <a
                href={wikiSummary.articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-xs"
                title="View Wikipedia Article"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Wikipedia
                <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Verified Wikipedia Information Card */}
      {wikiSummary && wikiSummary.extract && (
        <div className="bg-white dark:bg-[#0B0F19] rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">About the Artist (Wikipedia)</h2>
            </div>
            {wikiSummary.description && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-800">
                {wikiSummary.description}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {wikiSummary.extract}
          </p>

          {wikiSummary.articleUrl && (
            <div className="pt-1">
              <a
                href={wikiSummary.articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold inline-flex items-center gap-1 hover:underline"
              >
                Read full biography on Wikipedia
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Popular Tracks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Popular Tracks</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Top global recordings</span>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <TrackSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {topTracks.map((t, idx) => (
              <TrackItem
                key={`${t.id}_${idx}`}
                track={t}
                index={idx}
                playlistContext={topTracks}
                showAlbum={false}
              />
            ))}
          </div>
        )}
      </section>

      {/* Discography / Albums */}
      {albums.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Albums & Singles</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{albums.length} releases</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {albums.map((al) => (
              <AlbumCard
                key={al.id}
                album={al}
                onSelect={handleAlbumClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Authentication Required Modal when unauthenticated user clicks Follow */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sign in to Follow Artists</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                You must be logged in with Google to follow <strong className="text-slate-900 dark:text-white">{effectiveName}</strong>. Following artists saves them permanently in your Cloud Firestore account and syncs across all your devices.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowAuthModal(false);
                  try {
                    await login();
                  } catch {}
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In with Google
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
