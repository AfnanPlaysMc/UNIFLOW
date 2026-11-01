import { useEffect, useState, useCallback } from 'react';

export interface RouteState {
  path: 'home' | 'search' | 'yourlibrary' | 'accounts' | 'settings' | 'artist' | 'album' | 'playlist' | 'track';
  param?: string;
  subParam?: string;
}

export function parseHash(hash: string): RouteState {
  const clean = hash.replace(/^#\/?/, '').trim();
  if (!clean || clean === 'home') {
    return { path: 'home' };
  }

  const parts = clean.split('/').map((p) => decodeURIComponent(p));
  const main = parts[0]?.toLowerCase();

  if (main === 'search') {
    return { path: 'search', param: parts[1] || '' };
  }
  if (main === 'yourlibrary' || main === 'library') {
    return { path: 'yourlibrary' };
  }
  if (main === 'accounts' || main === 'account') {
    return { path: 'accounts' };
  }
  if (main === 'settings') {
    return { path: 'settings' };
  }
  if (main === 'artist') {
    return { path: 'artist', param: parts[1] || '', subParam: parts[2] };
  }
  if (main === 'album') {
    return { path: 'album', param: parts[1] || '' };
  }
  if (main === 'playlist') {
    return { path: 'playlist', param: parts[1] || '' };
  }
  if (main === 'track') {
    return { path: 'track', param: parts[1] || '' };
  }

  return { path: 'home' };
}

export function navigateToHash(path: string, param?: string) {
  let target = `#/${path}`;
  if (param) {
    target += `/${encodeURIComponent(param)}`;
  }
  if (window.location.hash !== target) {
    window.location.hash = target;
  }
}

export function useHashRoute(): [RouteState, (path: string, param?: string) => void] {
  const [route, setRoute] = useState<RouteState>(() => {
    return parseHash(typeof window !== 'undefined' ? window.location.hash : '#/home');
  });

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    // Set default hash if empty
    if (!window.location.hash) {
      window.location.hash = '#/home';
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((path: string, param?: string) => {
    navigateToHash(path, param);
  }, []);

  return [route, navigate];
}
