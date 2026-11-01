import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLrcLyrics } from './lrclib';

test('parseLrcLyrics parses standard and high-precision LRC lines accurately', () => {
  const lrc = `
[00:12.50] I used to rule the world
[00:16.80] Seas would rise when I gave the word
[01:05.123] Now in the morning I sleep alone
`;

  const lines = parseLrcLyrics(lrc);
  assert.equal(lines.length, 3);

  // Line 1: 00:12.50 -> 12.5 seconds
  assert.equal(lines[0].time, 12.5);
  assert.equal(lines[0].text, 'I used to rule the world');

  // Line 2: 00:16.80 -> 16.8 seconds
  assert.equal(lines[1].time, 16.8);
  assert.equal(lines[1].text, 'Seas would rise when I gave the word');

  // Line 3: 01:05.123 -> 65.123 seconds
  assert.equal(Math.round(lines[2].time * 1000) / 1000, 65.123);
  assert.equal(lines[2].text, 'Now in the morning I sleep alone');
});

test('parseLrcLyrics handles empty string or whitespace without crashing', () => {
  assert.deepEqual(parseLrcLyrics(''), []);
  assert.deepEqual(parseLrcLyrics('   \n\n  '), []);
});
