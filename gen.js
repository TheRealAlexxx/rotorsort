'use strict';
// Generates levels.json. Usage: node gen.js [seed] [count]
const fs = require('fs');
const Core = require('./core.js');
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(parseInt(process.argv[2] || '4', 10));
const want = parseInt(process.argv[3] || '40', 10);
const sets = [[3], [4], [3, 4], [2, 5], [3, 5], [2, 4], [4, 5]];
const out = [], seen = new Set();
while (out.length < want) {
  const n = 5 + Math.floor(rand() * 3);
  const rotors = sets[Math.floor(rand() * sets.length)];
  const a = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  const key = a.join('') + rotors.join('');
  if (seen.has(key) || Core.isSorted(a)) continue;
  seen.add(key);
  const sol = Core.solve(a, rotors);
  if (!sol || sol.length < 3 || sol.length > 12) continue;
  out.push({ row: a, rotors, par: sol.length, solution: sol });
}
out.sort((x, y) => x.par - y.par || x.row.length - y.row.length);
out.forEach((l, i) => { l.id = i + 1; });
fs.writeFileSync('levels.json', JSON.stringify(out));
const h = {}; out.forEach((l) => { h[l.par] = (h[l.par] || 0) + 1; });
console.log(out.length, JSON.stringify(h));
