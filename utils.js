/* KAZEHANA · utilidades base (RNG con semilla, helpers) */
(function (G) {
  'use strict';
  const U = (G.U = {});

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Generador aleatorio. Con semilla = reproducible (mundo/NPCs); sin semilla = Math.random
  U.mkRng = function (seed) {
    const f = seed == null ? Math.random : mulberry32(seed >>> 0);
    const R = {
      r: f,
      ri: (a, b) => a + Math.floor(f() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(f() * arr.length)],
      chance: (p) => f() < p,
      shuffle: (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
      },
      wpick: (arr, wf) => {
        let tot = 0; const ws = arr.map((x) => { const w = Math.max(0, wf(x)); tot += w; return w; });
        let r = f() * tot;
        for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r <= 0) return arr[i]; }
        return arr[arr.length - 1];
      },
    };
    return R;
  };
  U.R = U.mkRng();

  U.hash = function (str) {
    let h = 2166136261;
    str = String(str);
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let _uid = 0;
  U.uid = (p) => (p || 'id') + Date.now().toString(36) + (_uid++).toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  U.deep = (o) => JSON.parse(JSON.stringify(o));
  U.sum = (a) => a.reduce((s, x) => s + x, 0);
  U.pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  // Sustitución de marcadores en textos: {p} jugador, {n} npc, {o} o/a del jugador, {x} o/a del npc ...
  U.fill = function (str, ctx) {
    ctx = ctx || {};
    return String(str).replace(/\{(\w+)\}/g, (m, k) => (ctx[k] != null ? ctx[k] : m));
  };
})((window.G = window.G || {}));
