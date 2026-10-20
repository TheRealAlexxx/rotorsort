'use strict';
const test = require('node:test');
const assert = require('node:assert');
const C = require('./core.js');
const levels = require('./levels.json');

test('rotating right and left', () => {
  assert.deepStrictEqual(C.applyMove([1, 2, 3, 4, 5], 1, 3, 1), [1, 4, 2, 3, 5]);
  assert.deepStrictEqual(C.applyMove([1, 2, 3, 4, 5], 1, 3, -1), [1, 3, 4, 2, 5]);
});
test('left then right undoes itself', () => {
  const a = [5, 3, 1, 4, 2];
  assert.deepStrictEqual(C.applyMove(C.applyMove(a, 0, 4, -1), 0, 4, 1), a);
});
test('already sorted needs no moves; unsolvable returns null', () => {
  assert.deepStrictEqual(C.solve([1, 2, 3], [2]), []);
  assert.strictEqual(C.solve([2, 1, 3, 4], [3]), null); // 3-rotations are even permutations
});
test('BFS agrees with iterative-deepening brute force', () => {
  const rotors = [3, 4];
  const all = C.moves(5, rotors);
  const dfs = (a, d) => C.isSorted(a) || (d > 0 && all.some((m) => dfs(C.applyMove(a, m.pos, m.k, m.dir), d - 1)));
  for (const a of [[2, 1, 3, 5, 4], [5, 4, 3, 2, 1], [3, 1, 2, 5, 4], [2, 3, 4, 5, 1], [4, 2, 5, 1, 3]]) {
    const p = C.solve(a, rotors);
    assert.ok(p);
    assert.ok(dfs(a, p.length));
    assert.ok(p.length === 0 || !dfs(a, p.length - 1));
  }
});
test('every shipped solution sorts the row in exactly par moves', () => {
  assert.ok(levels.length >= 40);
  for (const l of levels) {
    let a = l.row;
    for (const m of l.solution) a = C.applyMove(a, m.pos, m.k, m.dir);
    assert.ok(C.isSorted(a), 'level ' + l.id);
    assert.strictEqual(l.solution.length, l.par);
    assert.strictEqual(C.solve(l.row, l.rotors).length, l.par);
  }
});
