/* KAZEHANA · mundo procedural: terreno, asentamientos, mazmorras y caminos */
(function (G) {
  'use strict';
  const D = G.D, U = G.U;
  const W = (G.World = {});

  // Códigos de terreno
  W.T = { AGUA: 0, ARENA: 1, PRADO: 2, BOSQUE: 3, MONTE: 4, CAMINO: 5 };
  W.ZONE = ['agua', 'costa', 'pradera', 'bosque', 'montana', 'camino'];
  W.ZONE_NAMES = ['Agua', 'Costa', 'Pradera', 'Bosque', 'Montaña', 'Camino'];
  W.walkable = (t) => t !== 0;

  function lattice(seed) {
    return function (ix, iy) { return (U.hash(seed + ':' + ix + ':' + iy) % 10000) / 10000; };
  }
  function noiseFn(seed) {
    const lat = lattice(seed);
    const sm = (t) => t * t * (3 - 2 * t);
    return function (x, y) {
      const x0 = Math.floor(x), y0 = Math.floor(y), fx = sm(x - x0), fy = sm(y - y0);
      const a = lat(x0, y0), b = lat(x0 + 1, y0), c = lat(x0, y0 + 1), d = lat(x0 + 1, y0 + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
  }

  const NAMES = {
    aldea: ['Kazehara', 'Mizuhana', 'Tsukimura', 'Hoshigawa', 'Akebono', 'Sakuragi', 'Yamabiko', 'Natsume', 'Fuyuzuki'],
    ciudad: ['Shirogane', 'Ryuumachi', 'Asahigawa', 'Kurenai', 'Tsuruga'],
    capital: ['Tenkyo', 'Miyakogawa'],
    monte: ['Raikou', 'Kurogane', 'Shiratori'],
    cueva: ['Cueva del Zorro Nocturno', 'Gruta del Eco', 'Cueva de los Cien Murmullos'],
    ruinas: ['Ruinas de Hoshikage', 'Ruinas del Sol Caído', 'Templo Hundido'],
    torre: ['Torre Quebrada', 'Torre del Cuervo'],
    mina: ['Mina Olvidada', 'Mina del Lamento'],
    bosque: ['Bosque de los Mil Faroles', 'Bosque Susurrante'],
    santuario: ['Santuario del Viento', 'Santuario de la Luna', 'Santuario del Alba'],
    guarida: ['Fortaleza del Eclipse'],
  };

  W.gen = function (seed, w, h) {
    w = w || 48; h = h || 36;
    const R = U.mkRng(seed);
    const nE = noiseFn(seed + 11), nM = noiseFn(seed + 97);
    const el = [], mo = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x - w / 2) / (w / 2), dy = (y - h / 2) / (h / 2);
      const d = Math.sqrt(dx * dx + dy * dy);
      let e = 0.55 * nE(x / 9, y / 9) + 0.3 * nE(x / 4.5, y / 4.5) + 0.15 * nE(x / 2, y / 2);
      e -= 0.42 * Math.pow(d, 2.2);
      el.push(e);
      mo.push(0.6 * nM(x / 7, y / 7) + 0.4 * nM(x / 3, y / 3));
    }
    const sorted = el.slice().sort((a, b) => a - b);
    const q = (p) => sorted[Math.floor(p * (sorted.length - 1))];
    const tWater = q(0.2), tSand = q(0.24), tMount = q(0.86);
    const lm = mo.filter((m, i) => el[i] > tSand && el[i] < tMount).sort((a, b) => a - b);
    const tForest = lm[Math.floor(lm.length * 0.62)];
    const tiles = [];
    for (let i = 0; i < w * h; i++) {
      const e = el[i];
      tiles.push(e < tWater ? 0 : e < tSand ? 1 : e > tMount ? 4 : mo[i] > tForest ? 3 : 2);
    }
    const idx = (x, y) => y * w + x;
    const inb = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
    // Mayor componente caminable
    const comp = new Array(w * h).fill(-1); let best = -1, bestSize = 0, cid = 0;
    for (let i = 0; i < w * h; i++) {
      if (tiles[i] === 0 || comp[i] !== -1) continue;
      const st = [i]; comp[i] = cid; let size = 0;
      while (st.length) {
        const c = st.pop(); size++;
        const cx = c % w, cy = (c / w) | 0;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([ax, ay]) => {
          const nx = cx + ax, ny = cy + ay;
          if (inb(nx, ny) && tiles[idx(nx, ny)] !== 0 && comp[idx(nx, ny)] === -1) { comp[idx(nx, ny)] = cid; st.push(idx(nx, ny)); }
        });
      }
      if (size > bestSize) { bestSize = size; best = cid; }
      cid++;
    }
    // Todo lo que no sea el continente principal se convierte en agua (sin islas inaccesibles)
    for (let i = 0; i < w * h; i++) if (tiles[i] !== 0 && comp[i] !== best) tiles[i] = 0;
    const land = [];
    for (let i = 0; i < w * h; i++) if (tiles[i] !== 0) land.push(i);

    const pois = [];
    const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    function place(type, count, minD, pred, namePool) {
      const names = R.shuffle(namePool || NAMES[type] || [type]);
      for (let n = 0; n < count; n++) {
        let spot = null, md = minD;
        for (let tries = 0; tries < 400 && !spot; tries++) {
          if (tries > 0 && tries % 100 === 0) md = Math.max(3, md - 2);
          const c = R.pick(land); const p = { x: c % w, y: (c / w) | 0 };
          if (!pred(p, c)) continue;
          if (pois.every((o) => dist(o, p) >= md)) spot = p;
        }
        if (!spot) continue;
        const kind = type;
        const settle = ['capital', 'ciudad', 'aldea', 'monte'].includes(type);
        const nm = names[n % names.length];
        const label = type === 'capital' ? 'Capital ' + nm : type === 'ciudad' ? 'Ciudad ' + nm : type === 'aldea' ? 'Aldea ' + nm : type === 'monte' ? 'Aldea del Monte ' + nm : nm;
        pois.push({ id: 'p' + pois.length, type: kind, settle, name: label, x: spot.x, y: spot.y, tier: 1, npcs: [], clearedDay: -99, revealed: false, sealTaken: false });
      }
    }
    // Capital cerca del centro
    const centre = land.slice().sort((a, b) => {
      const da = Math.abs((a % w) - w / 2) + Math.abs(((a / w) | 0) - h / 2), db = Math.abs((b % w) - w / 2) + Math.abs(((b / w) | 0) - h / 2);
      return da - db;
    }).filter((c) => tiles[c] === 2 || tiles[c] === 3);
    const cc = centre[0];
    pois.push({ id: 'p0', type: 'capital', settle: true, name: 'Capital ' + R.pick(NAMES.capital), x: cc % w, y: (cc / w) | 0, tier: 1, npcs: [], clearedDay: -99, revealed: false, sealTaken: false });
    const onGrass = (p, c) => tiles[c] === 2 || tiles[c] === 3;
    place('ciudad', 2, 12, onGrass);
    place('aldea', 4, 7, onGrass);
    place('monte', 1, 8, (p, c) => tiles[c] === 4 || (tiles[c] !== 1 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => inb(p.x + a, p.y + b) && tiles[idx(p.x + a, p.y + b)] === 4)));
    place('santuario', 3, 8, (p, c) => tiles[c] !== 1);
    place('cueva', 1, 6, (p, c) => tiles[c] === 4 || tiles[c] === 3);
    place('ruinas', 1, 6, (p, c) => tiles[c] !== 1);
    place('torre', 1, 6, (p, c) => tiles[c] === 2 || tiles[c] === 4);
    place('mina', 1, 6, (p, c) => tiles[c] === 4);
    place('bosque', 1, 6, (p, c) => tiles[c] === 3);
    // Guarida final: el punto más alejado de la capital
    const cap = pois[0];
    const far = land.filter((c) => tiles[c] !== 1).sort((a, b) => dist({ x: b % w, y: (b / w) | 0 }, cap) - dist({ x: a % w, y: (a / w) | 0 }, cap))[0];
    const lairSpot = { x: far % w, y: (far / w) | 0 };
    pois.push({ id: 'p' + pois.length, type: 'guarida', settle: false, name: NAMES.guarida[0], x: lairSpot.x, y: lairSpot.y, tier: 4, npcs: [], clearedDay: -99, revealed: false, hidden: true, sealTaken: false });
    // Nivel por distancia a la capital
    pois.forEach((p) => { if (p.type !== 'guarida') { const d = dist(p, cap); p.tier = d > 26 ? 3 : d > 15 ? 2 : 1; } });
    pois.forEach((p) => { tiles[idx(p.x, p.y)] = p.type === 'guarida' || ['cueva', 'mina'].includes(p.type) ? tiles[idx(p.x, p.y)] : 5; });

    // Caminos entre asentamientos (Dijkstra)
    const settlements = pois.filter((p) => p.settle);
    const cost = (t) => (t === 5 ? 0.4 : t === 2 ? 1 : t === 1 ? 1.3 : t === 3 ? 1.8 : t === 4 ? 4 : 99);
    function path(a, b) {
      const dd = new Array(w * h).fill(Infinity), prev = new Array(w * h).fill(-1), done = new Array(w * h).fill(false);
      dd[idx(a.x, a.y)] = 0; const open = [idx(a.x, a.y)];
      while (open.length) {
        let bi = 0; for (let i = 1; i < open.length; i++) if (dd[open[i]] < dd[open[bi]]) bi = i;
        const c = open.splice(bi, 1)[0]; if (done[c]) continue; done[c] = true;
        if (c === idx(b.x, b.y)) break;
        const cx = c % w, cy = (c / w) | 0;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([ax, ay]) => {
          const nx = cx + ax, ny = cy + ay; if (!inb(nx, ny)) return;
          const ni = idx(nx, ny); const cs = cost(tiles[ni]); if (cs > 50 || done[ni]) return;
          const nd = dd[c] + cs; if (nd < dd[ni]) { dd[ni] = nd; prev[ni] = c; open.push(ni); }
        });
      }
      const out = []; let c = idx(b.x, b.y);
      while (c !== -1 && c !== idx(a.x, a.y)) { out.push(c); c = prev[c]; }
      return out;
    }
    settlements.forEach((s) => {
      settlements.slice().filter((o) => o !== s).sort((p, q) => dist(p, s) - dist(q, s)).slice(0, 2).forEach((o) => {
        path(s, o).forEach((c) => { if (tiles[c] !== 0 && tiles[c] !== 4) tiles[c] = 5; });
      });
    });
    // Conectar el resto de POIs al asentamiento más cercano
    pois.filter((p) => !p.settle).forEach((p) => {
      const near = settlements.slice().sort((a, b) => dist(a, p) - dist(b, p))[0];
      const pa = path(p, near); pa.slice(0, Math.floor(pa.length * 0.6)).forEach((c) => { if (tiles[c] === 2 || tiles[c] === 1) tiles[c] = 5; });
    });
    return { w, h, tiles, pois, seed };
  };

  W.idx = (S, x, y) => y * S.world.w + x;
  W.tileAt = (S, x, y) => (x < 0 || y < 0 || x >= S.world.w || y >= S.world.h ? 0 : S.world.tiles[y * S.world.w + x]);
  W.poiAt = (S, x, y) => S.world.pois.find((p) => p.x === x && p.y === y && !(p.hidden && !p.revealed));
  W.dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  W.poi = (S, id) => S.world.pois.find((p) => p.id === id);
  W.reveal = function (S, x, y, r) {
    const w = S.world.w, ex = S.explored;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + 1) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < S.world.h) ex[ny * w + nx] = 1;
    }
  };
  W.nearestSettlement = function (S, from) {
    return S.world.pois.filter((p) => p.settle).sort((a, b) => W.dist(a, from) - W.dist(b, from))[0];
  };
  // BFS para caminar hasta una casilla
  W.findPath = function (S, from, to, maxLen) {
    const w = S.world.w, h = S.world.h;
    const key = (x, y) => y * w + x;
    const prev = new Map(); const q = [[from.x, from.y]]; prev.set(key(from.x, from.y), -1);
    while (q.length) {
      const [x, y] = q.shift();
      if (x === to.x && y === to.y) break;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([ax, ay]) => {
        const nx = x + ax, ny = y + ay; if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
        const k = key(nx, ny); if (prev.has(k) || S.world.tiles[k] === 0 || !S.explored[k]) return;
        prev.set(k, key(x, y)); q.push([nx, ny]);
      });
    }
    if (!prev.has(key(to.x, to.y))) return null;
    const out = []; let c = key(to.x, to.y);
    while (c !== -1 && c !== key(from.x, from.y)) { out.push({ x: c % w, y: (c / w) | 0 }); c = prev.get(c); }
    out.reverse();
    return out.length <= (maxLen || 60) ? out : null;
  };

  /* ---- Dónde está cada NPC según la hora ---- */
  W.npcPlace = function (S, npc, poi) {
    const places = D.SETTLE[poi.type].places;
    const work = D.JOBS[npc.job].place;
    const wp = places.includes(work) ? work : 'plaza';
    const ph = S.time.phase;
    const h = U.hash(npc.id + ':' + S.time.day + ':' + ph) % 100;
    if (npc.status === 'married' && S.family.home === poi.id) return 'casa';
    if (ph === 0) return h < 78 ? wp : h < 90 ? 'plaza' : 'casa';
    if (ph === 1) return h < 40 ? wp : h < 70 ? 'plaza' : h < 85 && places.includes('taberna') ? 'taberna' : 'casa';
    return h < 55 && places.includes('taberna') ? 'taberna' : h < 65 ? 'plaza' : 'casa';
  };
  W.npcsAt = function (S, poi, place) {
    return poi.npcs.map((id) => S.npcs[id]).filter((n) => n && n.status !== 'dead' && W.npcPlace(S, n, poi) === place);
  };
})((window.G = window.G || {}));
