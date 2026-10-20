'use strict';
// rotorsort core. A level is a row of numbers and a set of rotors. A rotor is
// a window length k: pick any position and rotate those k tiles one place
// left or right. Sort the row ascending in as few moves as possible.

function applyMove(arr, pos, k, dir) {
  const out = arr.slice();
  const w = arr.slice(pos, pos + k);
  const r = dir > 0 ? [w[k - 1]].concat(w.slice(0, k - 1)) : w.slice(1).concat([w[0]]);
  for (let i = 0; i < k; i++) out[pos + i] = r[i];
  return out;
}

function moves(n, rotors) {
  const list = [];
  for (const k of rotors) for (let p = 0; p + k <= n; p++) for (const d of [1, -1]) list.push({ pos: p, k, dir: d });
  return list;
}

const key = (a) => a.join(',');
const isSorted = (a) => a.every((v, i) => i === 0 || a[i - 1] <= v);

// Breadth-first search. Returns the shortest move list, or null if unsolvable.
function solve(start, rotors) {
  if (isSorted(start)) return [];
  const all = moves(start.length, rotors);
  const seen = new Map([[key(start), null]]);
  let layer = [start];
  while (layer.length) {
    const next = [];
    for (const s of layer) {
      for (const m of all) {
        const t = applyMove(s, m.pos, m.k, m.dir);
        const kt = key(t);
        if (seen.has(kt)) continue;
        seen.set(kt, { from: key(s), m });
        if (isSorted(t)) {
          const path = [];
          for (let c = kt; seen.get(c); c = seen.get(c).from) path.push(seen.get(c).m);
          return path.reverse();
        }
        next.push(t);
      }
    }
    layer = next;
  }
  return null;
}

// Number of distinct shortest solutions is not needed; par is the length.
const coreApi = { applyMove, moves, solve, isSorted };
if (typeof module !== 'undefined') module.exports = coreApi;
else window.Core = coreApi;
