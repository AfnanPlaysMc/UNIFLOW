import test from 'node:test';
import assert from 'node:assert/strict';
import { Playlist, Track } from '../types';

test('Playlist track management and calculation logic', () => {
  const samplePlaylist: Playlist = {
    id: 'pl_test_1',
    userId: 'user_1',
    title: 'My Favorite Mix',
    description: 'Chill vibe',
    tracks: [],
    trackCount: 0,
    duration: 0,
    coverUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const track1: Track = {
    id: 'dz_123',
    title: 'No Love',
    artist: 'Shubh',
    album: 'No Love Single',
    artwork: 'https://images.unsplash.com/cover1.jpg',
    duration: 170,
    streamUrl: 'https://preview.deezer.com/123.mp3',
    source: 'deezer',
    isFullLength: false,
  };

  const track2: Track = {
    id: 'dz_456',
    title: 'Elevated',
    artist: 'Shubh',
    album: 'Elevated Single',
    artwork: 'https://images.unsplash.com/cover2.jpg',
    duration: 195,
    streamUrl: 'https://preview.deezer.com/456.mp3',
    source: 'deezer',
    isFullLength: false,
  };

  // 1. Add track1
  const tracksAfter1 = [...samplePlaylist.tracks, track1];
  const pl1: Playlist = {
    ...samplePlaylist,
    tracks: tracksAfter1,
    trackCount: tracksAfter1.length,
    duration: samplePlaylist.duration + (track1.duration || 0),
    coverUrl: samplePlaylist.coverUrl || track1.artwork || '',
  };

  assert.equal(pl1.tracks.length, 1);
  assert.equal(pl1.trackCount, 1);
  assert.equal(pl1.duration, 170);
  assert.equal(pl1.coverUrl, 'https://images.unsplash.com/cover1.jpg');

  // 2. Prevent duplicate addition of track1
  const isDuplicate = pl1.tracks.some((t) => t.id === track1.id);
  assert.equal(isDuplicate, true);

  // 3. Add track2
  const tracksAfter2 = [...pl1.tracks, track2];
  const pl2: Playlist = {
    ...pl1,
    tracks: tracksAfter2,
    trackCount: tracksAfter2.length,
    duration: pl1.duration + (track2.duration || 0),
  };

  assert.equal(pl2.tracks.length, 2);
  assert.equal(pl2.duration, 365);
  assert.equal(pl2.tracks[0].title, 'No Love');
  assert.equal(pl2.tracks[1].title, 'Elevated');

  // 4. Remove track1
  const tracksAfterRemove = pl2.tracks.filter((t) => t.id !== track1.id);
  const pl3: Playlist = {
    ...pl2,
    tracks: tracksAfterRemove,
    trackCount: tracksAfterRemove.length,
    duration: Math.max(0, pl2.duration - (track1.duration || 0)),
    coverUrl: tracksAfterRemove.length > 0 ? tracksAfterRemove[0].artwork || '' : '',
  };

  assert.equal(pl3.tracks.length, 1);
  assert.equal(pl3.duration, 195);
  assert.equal(pl3.tracks[0].id, 'dz_456');
  assert.equal(pl3.coverUrl, 'https://images.unsplash.com/cover2.jpg');
});
