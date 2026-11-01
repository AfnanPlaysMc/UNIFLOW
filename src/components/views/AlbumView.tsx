import React, { useEffect, useState } from 'react';
import { Album, Track } from '../../types';
import { getDeezerAlbum } from '../../services/deezer';
import { useAudio } from '../../context/AudioContext';
import { useLibrary } from '../../context/LibraryContext';
import { TrackItem } from '../ui/TrackItem';
import { TrackSkeleton } from '../ui/Skeleton';
import { Play, Shuffle, BookmarkPlus, Calendar, Clock, Music } from 'lucide-react';
import { navigateToHash } from '../../utils/router';

interface AlbumViewProps {
  album?: Album | null;
  albumId?: string;
  onSelectArtistByName?: (artistName: string) => void;
}

export const AlbumView: React.FC<AlbumViewProps> = ({
  album: initialAlbum,
  albumId,
  onSelectArtistByName,
}) => {
  const { playTrack } = useAudio();
  const { createPlaylist } = useLibrary();
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(initialAlbum || null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const effectiveId = currentAlbum?.id || albumId || '';

  useEffect(() => {
    let active = true;

    async function loadTracks() {
      if (!effectiveId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getDeezerAlbum(effectiveId);
        if (active) {
          if (!currentAlbum && data?.album) {
            setCurrentAlbum(data.album);
          }
          setTracks(data.tracks || []);
        }
      } catch (err) {
        console.warn('Album tracks load error:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTracks();

    return () => {
      active = false;
    };
  }, [effectiveId]);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!currentAlbum || tracks.length === 0) return;
    const pl = await createPlaylist(currentAlbum.title, `Album by ${currentAlbum.artist}`);
    for (const t of tracks) {
      // Add tracks
    }
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleArtistClick = () => {
    const art = currentAlbum?.artist;
    if (!art) return;
    if (onSelectArtistByName) {
      onSelectArtistByName(art);
    } else {
      navigateToHash('artist', art);
    }
  };

  const totalSecs = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  const coverUrl =
    currentAlbum?.coverBig ||
    currentAlbum?.cover ||
    (tracks.length > 0 ? tracks[0].artwork : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400');

  return (
    <div className="space-y-8 pb-32">
      {/* Clean White/Blue & Black/Blue Album Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-50/70 via-white to-slate-50 dark:from-blue-950/40 dark:via-[#0B0F19] dark:to-[#060913] border border-slate-200/90 dark:border-slate-800 shadow-sm transition-colors">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-md shrink-0 border border-slate-200 dark:border-slate-800">
          <img
            src={coverUrl}
            alt={currentAlbum?.title || 'Album'}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            {currentAlbum?.genre || 'Album Record'}
          </span>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {currentAlbum?.title || 'Album'}
          </h1>

          <p
            onClick={handleArtistClick}
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer hover:underline"
          >
            {currentAlbum?.artist || 'Unknown Artist'}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1 font-mono">
            {currentAlbum?.releaseDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                {currentAlbum.releaseDate.split('-')[0]}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Music className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              {tracks.length || currentAlbum?.trackCount || 0} songs
            </span>
            {totalSecs > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                {Math.floor(totalSecs / 60)} min
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center sm:justify-start gap-3 pt-3">
            <button
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              Play All
            </button>

            <button
              onClick={handleShuffle}
              disabled={tracks.length === 0}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-xs"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>

            <button
              onClick={handleSaveToLibrary}
              disabled={tracks.length === 0}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all relative shadow-xs"
              title="Save Album as Playlist"
            >
              <BookmarkPlus className="w-4 h-4" />
              {savedToast && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-blue-600 text-[10px] text-white whitespace-nowrap shadow-md">
                  Saved!
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tracklist */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tracklist</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{tracks.length} tracks</span>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <TrackSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {tracks.map((t, idx) => (
              <TrackItem
                key={`${t.id}_${idx}`}
                track={t}
                index={idx}
                playlistContext={tracks}
                showAlbum={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
