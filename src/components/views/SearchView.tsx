import React, { useState, useEffect, useRef } from 'react';
import { Track, Artist, Album } from '../../types';
import { searchDeezer } from '../../services/deezer';
import { searchAudiusTracks } from '../../services/audius';
import { searchYouTubeTracks } from '../../services/youtube';
import { TrackItem } from '../ui/TrackItem';
import { ArtistCard } from '../ui/ArtistCard';
import { AlbumCard } from '../ui/AlbumCard';
import { TrackSkeleton } from '../ui/Skeleton';
import { Search as SearchIcon, X, Clock, Music, Sparkles } from 'lucide-react';
import { navigateToHash } from '../../utils/router';

interface SearchViewProps {
  onSelectArtist: (artist: Artist) => void;
  onSelectAlbum: (album: Album) => void;
  initialQuery?: string;
}

type SearchTab = 'all' | 'full' | 'tracks' | 'artists' | 'albums';

export const SearchView: React.FC<SearchViewProps> = ({
  onSelectArtist,
  onSelectAlbum,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('waveform_recent_searches');
      return saved ? JSON.parse(saved) : ['Shubh', 'No Love', 'Daft Punk', 'The Weeknd'];
    } catch {
      return [];
    }
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== term.toLowerCase());
      const updated = [term.trim(), ...filtered].slice(0, 8);
      try {
        localStorage.setItem('waveform_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('waveform_recent_searches');
    } catch {}
  };

  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
      if (initialQuery.trim()) {
        performSearch(initialQuery);
      }
    }
  }, [initialQuery]);

  const performSearch = async (searchTerm: string) => {
    const cleanTerm = searchTerm.trim();
    if (!cleanTerm) {
      setTracks([]);
      setArtists([]);
      setAlbums([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    saveRecentSearch(cleanTerm);

    try {
      // Pass 1: Search exact query across YouTube (full songs), Audius, and Deezer
      const [ytResult, audiusResult, dzResult] = await Promise.allSettled([
        searchYouTubeTracks(cleanTerm, 30),
        searchAudiusTracks(cleanTerm, 30),
        searchDeezer(cleanTerm, 40),
      ]);

      const foundTracks: Track[] = [];
      let foundArtists: Artist[] = [];
      let foundAlbums: Album[] = [];

      if (ytResult.status === 'fulfilled') {
        foundTracks.push(...ytResult.value);
      }
      if (audiusResult.status === 'fulfilled') {
        foundTracks.push(...audiusResult.value);
      }
      if (dzResult.status === 'fulfilled') {
        foundTracks.push(...dzResult.value.tracks);
        foundArtists = dzResult.value.artists;
        foundAlbums = dzResult.value.albums;
      }

      // If initial search yields few or zero tracks, try fallback broad query
      if (foundTracks.length < 3) {
        const simplifiedQuery = cleanTerm
          .replace(/\b(by|song|audio|official|ft\.|featuring)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (simplifiedQuery && simplifiedQuery !== cleanTerm) {
          const [ytFallback, audiusFallback, dzFallback] = await Promise.allSettled([
            searchYouTubeTracks(simplifiedQuery, 25),
            searchAudiusTracks(simplifiedQuery, 25),
            searchDeezer(simplifiedQuery, 30),
          ]);
          if (ytFallback.status === 'fulfilled') {
            foundTracks.push(...ytFallback.value);
          }
          if (audiusFallback.status === 'fulfilled') {
            foundTracks.push(...audiusFallback.value);
          }
          if (dzFallback.status === 'fulfilled') {
            foundTracks.push(...dzFallback.value.tracks);
            if (foundArtists.length === 0) foundArtists = dzFallback.value.artists;
            if (foundAlbums.length === 0) foundAlbums = dzFallback.value.albums;
          }
        }

        // Second fallback: search individual keywords (e.g. "Shubh")
        if (foundTracks.length < 3) {
          const words = cleanTerm.split(/\s+/).filter((w) => w.length > 2);
          if (words.length > 0) {
            const keyword = words[words.length - 1];
            const [dzKw, audiusKw] = await Promise.allSettled([
              searchDeezer(keyword, 30),
              searchAudiusTracks(keyword, 20),
            ]);
            if (audiusKw.status === 'fulfilled') {
              foundTracks.push(...audiusKw.value);
            }
            if (dzKw.status === 'fulfilled') {
              foundTracks.push(...dzKw.value.tracks);
              if (foundArtists.length === 0) foundArtists = dzKw.value.artists;
            }
          }
        }
      }

      // Ensure all official tracks are marked as full length since AudioSourceResolver plays full YouTube streams
      const officialTracks = foundTracks.map((t) => ({
        ...t,
        isFullLength: true,
      }));

      const trackMap = new Map<string, Track>();
      for (const t of officialTracks) {
        const normTitle = t.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normArtist = t.artist.toLowerCase().replace(/[^a-z0-9]/g, '');
        const key = `${normTitle}_${normArtist}`;
        const existing = trackMap.get(key);

        if (!existing) {
          trackMap.set(key, t);
        } else {
          // If existing is YouTube and new is Deezer (or vice-versa), merge HD studio artwork & metadata with videoId
          const existingIsYt = existing.source === 'youtube';
          const newIsYt = t.source === 'youtube';

          const primary = !existingIsYt ? existing : !newIsYt ? t : existing;
          const secondary = primary === existing ? t : existing;

          trackMap.set(key, {
            ...primary,
            videoId: primary.videoId || secondary.videoId,
            streamUrl: primary.streamUrl || secondary.streamUrl,
            duration: primary.duration || secondary.duration,
            isFullLength: true,
          });
        }
      }

      const sortedTracks = Array.from(trackMap.values());
      setTracks(sortedTracks);
      setArtists(foundArtists);
      setAlbums(foundAlbums);
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (val.trim()) {
        navigateToHash('search', val.trim());
      } else {
        navigateToHash('search');
      }
      performSearch(val);
    }, 350);
  };

  const handleClear = () => {
    setQuery('');
    setTracks([]);
    setArtists([]);
    setAlbums([]);
    navigateToHash('search');
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    navigateToHash('search', term);
    performSearch(term);
  };

  const fullSongs = tracks.filter((t) => t.isFullLength || t.duration > 45 || t.source === 'audius');
  const displayedTracks = activeTab === 'full' ? fullSongs : tracks;

  return (
    <div className="space-y-6 pb-32">
      {/* Search Input Bar */}
      <div className="relative max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <SearchIcon className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search songs, artists (e.g. Shubh, No Love), albums..."
          className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-[#0B0F19] border border-slate-300 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs font-medium"
          aria-label="Search query"
          autoFocus
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      {query.trim() && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
          {(
            [
              { id: 'all', label: `All Results (${tracks.length})` },
              { id: 'full', label: `Full Songs (${fullSongs.length})` },
              { id: 'tracks', label: `Tracks (${tracks.length})` },
              { id: 'artists', label: `Artists (${artists.length})` },
              { id: 'albums', label: `Albums (${albums.length})` },
            ] as { id: SearchTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* If no query, show recent searches and suggestions */}
      {!query.trim() && (
        <div className="space-y-6">
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Recent Searches
                </h3>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleRecentClick(term)}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-xs"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Suggested Explorations
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Shubh Hits', query: 'Shubh', bg: 'from-blue-50 to-indigo-50/40' },
                { label: 'No Love & Punjabi', query: 'No Love', bg: 'from-sky-50 to-cyan-50/40' },
                { label: 'Hip-Hop Hits', query: 'Hip Hop', bg: 'from-slate-50 to-blue-50/40' },
                { label: 'Electronic & Dance', query: 'Electronic', bg: 'from-indigo-50 to-blue-50/40' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleRecentClick(item.query)}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${item.bg} dark:from-slate-900 dark:to-blue-950/30 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-left transition-all hover:scale-[1.01] shadow-xs`}
                >
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">Explore songs →</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TrackSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Results Content: Vertical Up-to-Down List */}
      {!loading && query.trim() && (
        <div className="space-y-8">
          {/* Tracks Section */}
          {(activeTab === 'all' || activeTab === 'tracks' || activeTab === 'full') && displayedTracks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {activeTab === 'full' ? 'Full-Length Songs' : 'Songs'} ({displayedTracks.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeTab === 'full'
                      ? `Unrestricted full songs matching "${query}"`
                      : `Matching tracks for "${query}"`}
                  </p>
                </div>
              </div>

              {/* Up-to-Down Vertical List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {displayedTracks.map((t, idx) => (
                  <TrackItem
                    key={`${t.id}_${idx}`}
                    track={t}
                    index={idx}
                    showAlbum={false}
                    playlistContext={displayedTracks}
                    onSelectArtist={(name) => navigateToHash('artist', name)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Artists Section */}
          {(activeTab === 'all' || activeTab === 'artists') && artists.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3">Artists</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {artists.map((a) => (
                  <ArtistCard
                    key={a.id}
                    artist={a}
                    onSelect={(selected) => {
                      if (onSelectArtist) onSelectArtist(selected);
                      else navigateToHash('artist', selected.name);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Albums Section */}
          {(activeTab === 'all' || activeTab === 'albums') && albums.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3">Albums</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {albums.map((al) => (
                  <AlbumCard
                    key={al.id}
                    album={al}
                    onSelect={(selected) => {
                      if (onSelectAlbum) onSelectAlbum(selected);
                      else navigateToHash('album', selected.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {tracks.length === 0 && artists.length === 0 && albums.length === 0 && !loading && (
            <div className="py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <Music className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-800">No songs available for "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for the artist name (e.g. Shubh) or song title.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
