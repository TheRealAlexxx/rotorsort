'use strict';
const test = require('node:test');
const assert = require('node:assert');
const D = require('./daily.js');
test('every level appears once per cycle', () => {
  for (const count of [1, 2, 7, 40, 49]) {
    const seen = new Set();
    for (let i = 0; i < count; i++) seen.add(D.dailyIndex(new Date(Date.UTC(2026, 9, 21 + i)), count));
    assert.strictEqual(seen.size, count);
  }
});
test('stable through the day', () => {
  assert.strictEqual(D.dailyIndex(new Date('2026-10-21T00:00:01Z'), 40), D.dailyIndex(new Date('2026-10-21T23:59:59Z'), 40));
});
test('share text', () => {
  const d = new Date('2026-10-21T12:00:00Z');
  assert.strictEqual(D.shareText(d, 4, 4, 'u'), 'rotorsort daily 2026-10-21: sorted in 4 moves (par)\nu');
  assert.strictEqual(D.shareText(d, 7, 4, 'u'), 'rotorsort daily 2026-10-21: sorted in 7 moves (+3)\nu');
});
