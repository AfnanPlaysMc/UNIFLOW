import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTextSimilarity, evaluateCandidateMatch } from './source-resolver';
import { Track } from '../types';

test('calculateTextSimilarity correctly computes similarity between strings', () => {
  // Identical strings
  assert.equal(calculateTextSimilarity('Get Lucky', 'Get Lucky'), 1.0);

  // Case-insensitive and punctuation
  assert.equal(calculateTextSimilarity('get lucky!', 'Get Lucky'), 1.0);

  // Partial match
  const partial = calculateTextSimilarity('Get Lucky Radio Edit', 'Get Lucky');
  assert.ok(partial > 0.4 && partial < 1.0);

  // Empty strings
  assert.equal(calculateTextSimilarity('', 'Get Lucky'), 0);
  assert.equal(calculateTextSimilarity('', ''), 0);
});

test('evaluateCandidateMatch scores candidate tracks accurately', () => {
  const requested: Track = {
    id: 'req_1',
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    artwork: '',
    duration: 230,
    source: 'deezer',
    isFullLength: false,
  };

  const exactCandidate: Track = {
    id: 'cand_1',
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    artwork: '',
    duration: 231,
    source: 'audius',
    isFullLength: true,
  };

  const scoreExact = evaluateCandidateMatch(requested, exactCandidate);
  assert.ok(scoreExact >= 0.9, `Exact match score ${scoreExact} should be >= 0.9`);

  const remixCandidate: Track = {
    id: 'cand_2',
    title: 'Starboy Kygo Extended Remix Club Version',
    artist: 'The Weeknd feat. Kygo',
    album: 'Remixes',
    artwork: '',
    duration: 410, // Much longer duration
    source: 'audius',
    isFullLength: true,
  };

  const scoreRemix = evaluateCandidateMatch(requested, remixCandidate);
  assert.ok(scoreRemix < scoreExact, 'Remix score should be lower than original match');

  const unrelatedCandidate: Track = {
    id: 'cand_3',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    artwork: '',
    duration: 200,
    source: 'audius',
    isFullLength: true,
  };

  const scoreUnrelated = evaluateCandidateMatch(requested, unrelatedCandidate);
  assert.ok(scoreUnrelated < 0.5, 'Unrelated title should score below 0.5 threshold');
});
