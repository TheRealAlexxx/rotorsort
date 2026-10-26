'use strict';
// UI regression test: tiles must stay tappable even though draw() rebuilds them.
// A tap on a touch screen fires a synthesized hover before the click. When the
// hover handler rebuilt the tile mid-gesture, the browser aborted the tap's
// click and the move never happened - tiles were dead on phones (reproduced
// twice via CDP click-at against the live site, while node.click() worked).
// This harness loads game.js into a minimal fake DOM and simulates taps the way
// a browser delivers them: hover handler runs, and if it mutated the row the
// click is aborted, exactly as observed.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');

function makeEl(tag) {
  const el = {
    tag, children: [], parent: null, className: '', hidden: false, _text: '',
    classList: {
      toggle(c, on) { const s = new Set(el.className.split(' ').filter(Boolean)); on ? s.add(c) : s.delete(c); el.className = [...s].join(' '); },
      contains(c) { return el.className.split(' ').includes(c); },
    },
    set innerHTML(v) { if (v === '') el.children.forEach((c) => { c.parent = null; }), el.children = []; },
    get innerHTML() { return ''; },
    appendChild(c) { c.parent = el; el.children.push(c); },
    set textContent(v) { el._text = String(v); },
    get textContent() { return el._text; },
    closest(sel) { let n = el; while (n) { if (sel === '.t' && n.className.split(' ').includes('t')) return n; n = n.parent; } return null; },
  };
  return el;
}

async function boot(gamePath) {
  const ids = ['rotors', 'dir', 'row', 'info', 'msg', 'share', 'lvl', 'levels', 'daily', 'undo', 'reset', 'prev', 'next'];
  const byId = Object.fromEntries(ids.map((id) => [id, makeEl('div')]));
  const mem = {};
  const sandbox = {
    document: { getElementById: (id) => byId[id] || null, createElement: makeEl },
    fetch: () => Promise.resolve({ json: () => Promise.resolve(require('./levels.json')) }),
    localStorage: { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } },
    location: { hash: '' },
    history: { replaceState() {} },
    Core: require('./core.js'),
    Daily: require('./daily.js'),
  };
  vm.runInNewContext(fs.readFileSync(gamePath, 'utf8'), sandbox);
  await new Promise((r) => setImmediate(r)); // let the levels fetch land
  const row$ = byId.row;
  const tap = (i) => {
    const before = row$.children[i];
    if (before.onmouseenter) before.onmouseenter({ target: before });
    if (row$.onmouseover) row$.onmouseover({ target: before });
    if (row$.children[i] !== before) return 'aborted'; // browser cancels the click after a mid-gesture rebuild
    if (row$.onclick) row$.onclick({ target: row$.children[i] });
    else row$.children[i].onclick({ target: row$.children[i] });
    return 'clicked';
  };
  return { byId, row$, tap };
}

test('a tap on a tile rotates the window even though hover redraws the row', async () => {
  const { byId, tap } = await boot('./game.js');
  const rowText = () => byId.row.children.map((c) => c.textContent).join(',');
  const before = rowText();
  let result = tap(0);
  if (result === 'aborted') result = tap(0); // first tap may only preview the window; the next must land
  assert.strictEqual(result, 'clicked', 'two taps never delivered a move to the game');
  assert.notStrictEqual(rowText(), before, 'row did not change after the tap');
  assert.match(byId.info.textContent, /moves 1 /, 'move counter did not advance');
});

test('hovering a tile highlights its window without looping', async () => {
  const { byId, row$ } = await boot('./game.js');
  const tile = row$.children[0];
  if (row$.onmouseover) row$.onmouseover({ target: tile });
  else tile.onmouseenter({ target: tile });
  assert.ok(row$.children[0].className.split(' ').includes('hl'), 'window not highlighted after hover');
  // firing again at the same spot must be a no-op (idempotent), not an endless redraw
  const cur = row$.children[0];
  if (row$.onmouseover) row$.onmouseover({ target: cur });
  else cur.onmouseenter({ target: cur });
  assert.strictEqual(row$.children[0], cur, 'hover over the same tile rebuilt the row again');
});
