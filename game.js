'use strict';
(function () {
  const $ = (id) => document.getElementById(id);
  const store = { get() { try { return JSON.parse(localStorage.getItem('rotorsort') || '{}'); } catch (e) { return {}; } }, set(v) { try { localStorage.setItem('rotorsort', JSON.stringify(v)); } catch (e) { /* private mode */ } } };
  let levels = [], idx = 0, lv, row, hist, k, dir, hover = -1, daily = false;
  fetch('levels.json').then((r) => r.json()).then((d) => {
    levels = d;
    daily = location.hash === '#daily';
    const h = daily ? Daily.dailyIndex(new Date(), d.length) + 1 : parseInt(location.hash.slice(1), 10);
    d.forEach((l, i) => { const b = document.createElement('button'); b.textContent = l.id; b.onclick = () => { daily = false; load(i); }; $('levels').appendChild(b); });
    load(h > 0 && h <= d.length ? h - 1 : Math.min(store.get().cur || 0, d.length - 1));
  });
  function load(i) {
    idx = i; lv = levels[i]; row = lv.row.slice(); hist = []; k = lv.rotors[0]; dir = 1;
    const s = store.get(); s.cur = i; store.set(s); history.replaceState(null, '', daily ? '#daily' : '#' + (i + 1)); $('share').hidden = true;
    $('lvl').textContent = 'level ' + lv.id + ' of ' + levels.length;
    $('rotors').innerHTML = '';
    lv.rotors.forEach((r) => { const b = document.createElement('button'); b.textContent = r; b.onclick = () => { k = r; draw(); }; $('rotors').appendChild(b); });
    draw(); list();
  }
  function draw() {
    [...$('rotors').children].forEach((b) => b.classList.toggle('on', +b.textContent === k));
    $('dir').textContent = dir > 0 ? 'right  >' : '<  left';
    const r = $('row'); r.innerHTML = '';
    row.forEach((v, i) => {
      const t = document.createElement('div'); t.className = 't' + (v === i + 1 ? ' ok' : '') + (hover >= 0 && i >= hover && i < hover + k ? ' hl' : '');
      t.textContent = v;
      r.appendChild(t);
    });
    const done = Core.isSorted(row);
    $('info').textContent = 'moves ' + hist.length + '  par ' + lv.par;
    $('msg').className = done ? 'win' : '';
    $('msg').textContent = done ? 'Sorted in ' + hist.length + '. ' + (hist.length <= lv.par ? 'Par, the proven minimum.' : (hist.length - lv.par) + ' over par.') : '';
    if (done) { const s = store.get(); s.best = s.best || {}; if (!s.best[idx] || hist.length < s.best[idx]) s.best[idx] = hist.length; store.set(s); list(); $('share').hidden = !daily; }
  }
  // Tile events live on the row container, not the tiles: draw() rebuilds the
  // tiles, so a per-tile handler dies with its node. On touch screens a tap's
  // synthesized hover runs before the click, and the rebuild aborted the tap's
  // click entirely - tiles were untappable on phones. The container survives.
  const row$ = $('row');
  row$.onmouseover = (e) => { const t = e.target.closest('.t'); const i = t ? [...row$.children].indexOf(t) : -1; if (i !== hover) { hover = i; draw(); } };
  row$.onmouseleave = () => { if (hover !== -1) { hover = -1; draw(); } };
  row$.onclick = (e) => { const t = e.target.closest('.t'); if (t) move([...row$.children].indexOf(t)); };
  function move(i) {
    if (Core.isSorted(row) || i + k > row.length) return;
    hist.push(row); row = Core.applyMove(row, i, k, dir); draw();
  }
  function list() { const best = store.get().best || {}; [...$('levels').children].forEach((b, i) => { b.className = (i === idx ? 'cur ' : '') + (best[i] ? (best[i] <= levels[i].par ? 'par' : 'done') : ''); }); }
  $('daily').onclick = () => { daily = true; load(Daily.dailyIndex(new Date(), levels.length)); };
  $('share').onclick = () => {
    const text = Daily.shareText(new Date(), hist.length, lv.par, 'https://therealalexxx.github.io/rotorsort/#daily');
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => { $('msg').textContent = 'Copied: ' + text.split('\n')[0]; }, () => { $('msg').textContent = text; });
  };
  $('dir').onclick = () => { dir = -dir; draw(); };
  $('undo').onclick = () => { if (hist.length) { row = hist.pop(); draw(); } };
  $('reset').onclick = () => load(idx);
  $('prev').onclick = () => idx > 0 && (daily = false, load(idx - 1));
  $('next').onclick = () => idx + 1 < levels.length && (daily = false, load(idx + 1));
})();
