import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LibraryProvider } from './context/LibraryContext';
import { AudioProvider } from './context/AudioContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { MobileNav } from './components/layout/MobileNav';
import { PlayerBar } from './components/player/PlayerBar';
import { FullScreenPlayer } from './components/player/FullScreenPlayer';
import { QueueDrawer } from './components/player/QueueDrawer';
import { LyricsOverlay } from './components/lyrics/LyricsOverlay';

import { HomeView } from './components/views/HomeView';
import { SearchView } from './components/views/SearchView';
import { ArtistView } from './components/views/ArtistView';
import { AlbumView } from './components/views/AlbumView';
import { PlaylistView } from './components/views/PlaylistView';
import { LibraryView } from './components/views/LibraryView';
import { AccountsView } from './components/views/AccountsView';
import { SettingsView } from './components/views/SettingsView';

import { useLibrary } from './context/LibraryContext';
import { Artist, Album, Playlist } from './types';
import { useHashRoute, navigateToHash } from './utils/router';

const AppContent: React.FC = () => {
  const [route, navigate] = useHashRoute();
  const { playlists } = useLibrary();
  const [activeArtist, setActiveArtist] = useState<Artist | null>(null);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);

  const handleSelectArtist = (artist: Artist) => {
    setActiveArtist(artist);
    navigate('artist', artist.name);
  };

  const handleSelectAlbum = (album: Album) => {
    setActiveAlbum(album);
    navigate('album', album.id);
  };

  const handleSelectPlaylist = (data: Playlist | string) => {
    const id = typeof data === 'string' ? data : data.id;
    const plObj = typeof data === 'object' ? data : playlists.find((p) => p.id === id) || null;
    setActivePlaylist(plObj);
    navigate('playlist', id);
  };

  const handleSelectGenre = (genre: string) => {
    navigate('search', genre);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('home');
    }
  };

  // Convert router path to sidebar active key
  const sidebarView =
    route.path === 'yourlibrary'
      ? 'library'
      : route.path === 'accounts'
      ? 'accounts'
      : route.path === 'settings'
      ? 'settings'
      : route.path === 'search'
      ? 'search'
      : route.path === 'home'
      ? 'home'
      : 'home';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#060913] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Desktop Left Sidebar: White & Blue / Black & Blue Palette */}
      <div className="hidden md:flex h-full">
        <Sidebar
          currentView={sidebarView}
          onNavigate={(targetPath, data) => {
            if (targetPath === 'artist') {
              if (typeof data === 'object' && data) {
                handleSelectArtist(data);
              } else if (typeof data === 'string') {
                navigate('artist', data);
              } else {
                navigate('artist');
              }
            } else if (targetPath === 'album') {
              if (typeof data === 'object' && data) {
                handleSelectAlbum(data);
              } else if (typeof data === 'string') {
                navigate('album', data);
              } else {
                navigate('album');
              }
            } else if (targetPath === 'playlist' && data) {
              handleSelectPlaylist(data);
            } else {
              navigate(targetPath, data);
            }
          }}
          onOpenCreatePlaylist={() => navigate('yourlibrary')}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <TopBar
          onBack={handleBack}
          canBack={true}
          onOpenSearch={() => navigate('search')}
          onOpenSettings={() => navigate('settings')}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {route.path === 'home' && (
              <HomeView
                onSelectArtist={handleSelectArtist}
                onSelectAlbum={handleSelectAlbum}
                onSelectGenre={handleSelectGenre}
              />
            )}

            {route.path === 'search' && (
              <SearchView
                onSelectArtist={handleSelectArtist}
                onSelectAlbum={handleSelectAlbum}
                initialQuery={route.param || ''}
              />
            )}

            {route.path === 'artist' && (
              <ArtistView
                artist={activeArtist}
                artistName={route.param}
                onSelectAlbum={handleSelectAlbum}
              />
            )}

            {route.path === 'album' && (
              <AlbumView
                album={activeAlbum}
                albumId={route.param}
                onSelectArtistByName={(name) => navigate('artist', name)}
              />
            )}

            {route.path === 'playlist' && (
              <PlaylistView
                playlist={activePlaylist}
                playlistId={route.param}
                onDeleted={() => navigate('yourlibrary')}
              />
            )}

            {route.path === 'yourlibrary' && (
              <LibraryView
                onSelectPlaylist={handleSelectPlaylist}
              />
            )}

            {route.path === 'accounts' && (
              <AccountsView />
            )}

            {route.path === 'settings' && (
              <SettingsView />
            )}
          </div>
        </main>

        {/* Persistent Bottom Player Bar for Desktop */}
        <div className="hidden md:block">
          <PlayerBar />
        </div>

        {/* Mobile Navigation & Mini Player */}
        <MobileNav
          currentView={sidebarView}
          onNavigate={(target) => navigate(target)}
        />
      </div>

      {/* Persistent Global Modals and Overlays */}
      <QueueDrawer />
      <LyricsOverlay />
      <FullScreenPlayer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LibraryProvider>
          <AudioProvider>
            <AppContent />
          </AudioProvider>
        </LibraryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
