/* KAZEHANA · lógica principal (sin tocar el DOM) */
(function (G) {
  'use strict';
  const D = G.D, U = G.U, W = G.World, NPC = G.NPC;
  const Game = (G.Game = {});
  const S = () => G.S;

  /* ---------- utilidades de estado ---------- */
  Game.log = function (text, cls) {
    const s = S(); if (!s) return;
    s.log.push({ d: s.time.day, ph: s.time.phase, t: text, c: cls || '' });
    if (s.log.length > 250) s.log.shift();
  };
  Game.age = (P) => P.age0 + Math.floor((S().time.day - 1) / D.DAYS_YEAR);
  Game.season = () => Math.floor(((S().time.day - 1) % D.DAYS_YEAR) / D.DAYS_SEASON);
  Game.xpNeed = (l) => 25 + l * l * 10;
  Game.addHonor = (n) => { const P = S().player; P.honor = U.clamp(P.honor + n, -100, 100); };

  Game.derived = function (P) {
    const st = Object.assign({}, P.stats);
    Object.values(P.equip).forEach((id) => {
      const it = id && D.ITEMS[id];
      if (!it) return;
      if (it.bonus) Object.keys(it.bonus).forEach((k) => (st[k] += it.bonus[k]));
      if (it.agi) st.agi += it.agi;
    });
    const w = D.ITEMS[P.equip.arma], a = D.ITEMS[P.equip.armadura], l = P.level;
    return {
      st, maxHp: 28 + st.fue * 3 + st.agi + l * 9 + (P.traits.includes('rudo') ? 12 : 0), maxEn: 12 + st.esp * 3 + l * 3,
      atk: 4 + st.fue * 1.5 + (w ? w.atk || 0 : 0) + l * 1.2, mag: 3 + st.esp * 1.5 + st.men * 0.6 + (w ? w.mag || 0 : 0) + l * 1.2,
      def: (a ? a.def : 0) + st.agi * 0.4 + l * 0.6, spd: st.agi, crit: 5 + st.agi * 0.6, dodge: Math.min(40, 3 + st.agi * 0.7),
    };
  };
  Game.skills = (P) => (D.POWERS[P.power] ? D.POWERS[P.power].skills.filter((s) => s.lvl <= P.level) : []);
  Game.clampVitals = function () { const P = S().player, d = Game.derived(P); P.hp = U.clamp(Math.round(P.hp), 0, d.maxHp); P.en = U.clamp(Math.round(P.en), 0, d.maxEn); };
  Game.heal = function (hp, en) { const P = S().player, d = Game.derived(P); P.hp = Math.min(d.maxHp, P.hp + hp); P.en = Math.min(d.maxEn, P.en + en); };

  /* ---------- nueva partida ---------- */
  Game.newGame = function (cfg) {
    const seed = cfg.seed || (Math.random() * 1e9) | 0;
    const world = W.gen(seed);
    const R = U.mkRng(seed ^ 0x5eed);
    let originId = cfg.origin;
    const bonus = {};
    if (originId === 'azar') {
      originId = R.pick(['aldea', 'ciudad', 'capital', 'monte']);
      bonus[R.pick(Object.keys(D.STATS))] = 1;
    }
    const origin = D.ORIGINS[originId];
    const stats = Object.assign({ fue: 5, agi: 5, men: 5, car: 5, esp: 5 }, {});
    Object.keys(cfg.stats || {}).forEach((k) => (stats[k] = cfg.stats[k]));
    Object.keys(origin.bonus).forEach((k) => (stats[k] += origin.bonus[k]));
    Object.keys(bonus).forEach((k) => (stats[k] += bonus[k]));
    let gold = origin.gold, honor = 0;
    cfg.traits.forEach((t) => { const T = D.TRAITS[t]; if (T.s) Object.keys(T.s).forEach((k) => (stats[k] += T.s[k])); if (T.gold) gold += T.gold; if (T.honor) honor += T.honor; });
    const look = Object.assign({}, cfg.look, { gender: cfg.gender, age: cfg.age, accs: (cfg.look.accs || []).slice(), grey: 0, buildTags: NPC.buildTagsFor(cfg.gender, cfg.build, cfg.height), build: cfg.build, height: cfg.height });
    const P = {
      id: 'player', name: cfg.name, gender: cfg.gender, age0: cfg.age, origin: originId, self: cfg.self || {}, look, build: cfg.build, buildTags: look.buildTags, height: cfg.height,
      traits: cfg.traits.slice(), power: cfg.power, powerRank: 0, level: 1, xp: 0, points: 0, stats, hp: 1, en: 1, gold, inv: {}, equip: { arma: null, armadura: null, amuleto: null },
      honor, fame: 0, x: 0, y: 0, prefs: { interest: cfg.interest, types: (cfg.types || []).slice(0, 2) }, spouse: null, permadeath: !!cfg.permadeath, kills: 0, looksBonus: 0,
    };
    Object.keys(origin.items).forEach((k) => (P.inv[k] = origin.items[k]));
    P.inv.bokken = 1; P.equip.arma = 'bokken';
    const st = { v: 1, seed, savedAt: 0, player: P, world, explored: new Array(world.w * world.h).fill(0), npcs: {}, time: { day: 1, phase: 0, step: 0 }, quests: [], boards: {}, main: { stage: 0, seals: 0, lair: false, done: false },
      family: { home: null, children: [], pending: null }, log: [], dungeon: null, flags: { recent: [], cool: 0 }, gen: 1, combat: null, counters: { fights: 0, days: 0, talks: 0 } };
    G.S = st;
    // Punto de partida
    const settles = world.pois.filter((p) => p.settle);
    let start = originId === 'capital' ? world.pois[0] : settles.find((p) => p.type === (originId === 'monte' ? 'monte' : originId)) || R.pick(settles);
    if (originId === 'aldea' || originId === 'ciudad') { const opts = settles.filter((p) => p.type === originId); start = R.pick(opts.length ? opts : settles); }
    P.x = start.x; P.y = start.y; P.home = start.id; start.revealed = true;
    W.reveal(st, P.x, P.y, 5);
    // NPCs de todos los asentamientos
    let nid = 1;
    settles.forEach((poi) => {
      const conf = D.SETTLE[poi.type];
      for (let i = 0; i < conf.npcs; i++) {
        const n = NPC.gen(R, { settle: poi.type, home: poi.id, level: poi.tier * 2 - 1, id: 'n' + nid++ });
        st.npcs[n.id] = n; poi.npcs.push(n.id);
      }
      // Garantiza personas con las que pueda haber química
      if (P.prefs.interest !== 'none') {
        let c = poi.npcs.filter((id) => NPC.canRomance(st.npcs[id], P) && st.npcs[id].age < 46).length;
        while (c < 3) {
          const g = P.prefs.interest === 'both' ? R.pick(['m', 'f']) : P.prefs.interest;
          const n = NPC.gen(R, { settle: poi.type, home: poi.id, gender: g, age: R.ri(19, 38), level: poi.tier * 2 - 1, id: 'n' + nid++ });
          if (!n.interestedIn.includes(P.gender)) n.interestedIn.push(P.gender);
          st.npcs[n.id] = n; poi.npcs.push(n.id); c++;
        }
      }
    });
    // Mentor en el pueblo inicial y rival en la capital
    const mentor = NPC.gen(R, { settle: start.type, home: start.id, job: 'maestro', pers: 'sabio', age: R.ri(62, 74), special: 'mentor', level: 8, id: 'n_mentor' });
    mentor.look.grey = 2; mentor.power = R.pick(Object.keys(D.POWERS)); mentor.affinity = 12;
    st.npcs[mentor.id] = mentor; start.npcs.push(mentor.id);
    const rival = NPC.gen(R, { settle: 'capital', home: world.pois[0].id, job: 'rival', pers: 'orgulloso', age: R.ri(21, 28), special: 'rival', level: 3, id: 'n_rival' });
    rival.power = R.pick(Object.keys(D.POWERS)); rival.look.accs = rival.look.accs.filter((a) => a !== 'orejas');
    st.npcs[rival.id] = rival; world.pois[0].npcs.push(rival.id);
    // Misiones principales
    st.quests.push({ id: 'main1', kind: 'main', type: 'talk', title: 'Palabras del maestro', desc: 'Habla con ' + NPC.fullName(mentor) + ' en ' + start.name + '. Dicen que sabe algo sobre el Sello.', status: 'active', reward: { xp: 30 } });
    Game.clampVitals(); const d = Game.derived(P); P.hp = d.maxHp; P.en = d.maxEn;
    Game.log(origin.intro, 'story');
    Game.log('Comienza tu aventura en ' + start.name + '.', 'story');
    return st;
  };

  /* ---------- tiempo ---------- */
  Game.advance = function (steps) {
    const s = S(); const out = [];
    s.time.step += steps;
    while (s.time.step >= D.STEPS_PHASE) {
      s.time.step -= D.STEPS_PHASE; s.time.phase++;
      if (s.time.phase >= 3) { s.time.phase = 0; s.time.day++; out.push(...Game.onDay()); }
      out.push(...Game.onPhase());
    }
    return out;
  };
  Game.skipToMorning = function () {
    const s = S(); const out = []; const d0 = s.time.day;
    let guard = 0;
    while (!(s.time.phase === 0 && s.time.day > d0) && guard++ < 40) out.push(...Game.advance(1));
    s.time.step = 0; return out;
  };
  Game.onPhase = function () {
    const s = S(); const out = [];
    s.flags.cool = Math.max(0, s.flags.cool - 1);
    return out;
  };
  Game.onDay = function () {
    const s = S(), P = s.player, out = [];
    s.counters.days++;
    const base = (n) => D.PERS[n.pers].base;
    Object.values(s.npcs).forEach((n) => {
      n.today = {};
      if (n.mood !== base(n)[0] && U.R.chance(0.7)) n.mood = U.R.pick(base(n));
      n.suspicion = Math.max(0, n.suspicion - 1);
      if (n.status === 'dating' || n.status === 'married') { n.romance = Math.max(0, n.romance - 1); }
      else if (n.status !== 'ex' && n.met && n.affinity > 15) n.affinity -= U.R.chance(0.2) ? 1 : 0;
      if (((s.time.day - 1) % D.DAYS_YEAR) === 0 && s.time.day > 1) n.age++;
    });
    if (((s.time.day - 1) % D.DAYS_YEAR) === 0 && s.time.day > 1) out.push('🎂 ¡Ha pasado un año! Ahora tienes ' + Game.age(P) + ' años.');
    if (((s.time.day - 1) % D.DAYS_SEASON) === 0 && s.time.day > 1) out.push(D.SEASON_E[Game.season()] + ' Llega ' + D.SEASONS[Game.season()].toLowerCase() + '.');
    if (G.Social && G.Social.onDay) out.push(...G.Social.onDay());
    out.forEach((t) => Game.log(t, 'sys'));
    return out;
  };

  /* ---------- inventario ---------- */
  Game.count = (id) => S().player.inv[id] || 0;
  Game.addItem = function (id, n) {
    const P = S().player; n = n == null ? 1 : n;
    P.inv[id] = (P.inv[id] || 0) + n;
    if (P.inv[id] <= 0) delete P.inv[id];
  };
  Game.equip = function (id) {
    const P = S().player, it = D.ITEMS[id]; if (!it || Game.count(id) < 1) return false;
    const slot = it.t === 'weapon' ? 'arma' : it.t === 'armor' ? 'armadura' : it.t === 'amulet' ? 'amuleto' : null; if (!slot) return false;
    P.equip[slot] = id; Game.clampVitals(); return true;
  };
  Game.unequip = (slot) => { S().player.equip[slot] = null; Game.clampVitals(); };
  Game.useItem = function (id) {
    const P = S().player, it = D.ITEMS[id]; if (!it || it.t !== 'cons' || Game.count(id) < 1) return null;
    if (!(it.hp || it.en || it.cure)) return { ok: false, msg: 'Eso solo sirve en combate.' };
    Game.addItem(id, -1); Game.heal(it.hp || 0, it.en || 0);
    return { ok: true, msg: it.e + ' Usas ' + it.n + (it.hp ? ' (+' + it.hp + ' vida)' : '') + (it.en ? ' (+' + it.en + ' energía)' : '') };
  };
  Game.buyPrice = (id, poi) => Math.max(1, Math.round(D.ITEMS[id].price * (1.0 - Math.min(0.2, (S().player.stats.car - 5) * 0.012))));
  Game.sellPrice = (id) => Math.max(1, Math.floor(D.ITEMS[id].price * 0.4));
  Game.buy = function (id) {
    const P = S().player, cost = Game.buyPrice(id);
    if (P.gold < cost) return { ok: false, msg: 'No tienes suficientes ryo.' };
    P.gold -= cost; Game.addItem(id, 1);
    return { ok: true, msg: 'Compras ' + D.ITEMS[id].n + ' por ' + cost + ' ryo.' };
  };
  Game.sell = function (id) {
    const P = S().player; if (Game.count(id) < 1 || D.ITEMS[id].t === 'key') return { ok: false, msg: 'No puedes vender eso.' };
    if (Object.values(P.equip).includes(id) && Game.count(id) < 2) return { ok: false, msg: 'Está equipado.' };
    const g = Game.sellPrice(id); P.gold += g; Game.addItem(id, -1);
    return { ok: true, msg: 'Vendes ' + D.ITEMS[id].n + ' por ' + g + ' ryo.' };
  };

  /* ---------- experiencia ---------- */
  Game.gainXp = function (n) {
    const P = S().player, out = [];
    const mult = 1 + (P.traits.includes('curioso') ? 0.1 : 0);
    n = Math.round(n * mult); P.xp += n; out.push('✨ +' + n + ' XP');
    while (P.level < 40 && P.xp >= Game.xpNeed(P.level)) {
      P.xp -= Game.xpNeed(P.level); P.level++; P.points += 3;
      const d = Game.derived(P); P.hp = Math.min(d.maxHp, P.hp + Math.round(d.maxHp * 0.4)); P.en = d.maxEn;
      out.push('🎉 ¡Subes al nivel ' + P.level + '! (+3 puntos de atributo)');
      D.POWERS[P.power].skills.filter((s) => s.lvl === P.level).forEach((s) => out.push('🔓 Nueva técnica: ' + s.n));
    }
    return out;
  };
  Game.spendPoint = function (stat) {
    const P = S().player; if (P.points < 1 || P.stats[stat] >= 40) return false;
    P.stats[stat]++; P.points--; Game.clampVitals(); return true;
  };

  /* ---------- efectos genéricos (eventos, misiones, recompensas) ---------- */
  Game.statCheck = function (stat, dc) {
    const P = S().player, d = Game.derived(P);
    const roll = d.st[stat] + U.R.ri(1, 10) + Math.floor(P.level / 2);
    return { ok: roll >= dc, roll, dc };
  };
  Game.meets = function (req) {
    if (!req) return true; const P = S().player, d = Game.derived(P);
    if (req.item && Game.count(req.item) < 1) return false;
    if (req.gold && P.gold < req.gold) return false;
    if (req.stat && d.st[req.stat] < req.min) return false;
    return true;
  };
  Game.reqText = function (req) {
    if (!req) return '';
    if (req.item) return ' [' + D.ITEMS[req.item].e + ' ' + D.ITEMS[req.item].n + ']';
    if (req.gold) return ' [' + req.gold + ' ryo]';
    if (req.stat) return ' [' + D.STATS[req.stat].n + ' ' + req.min + '+]';
    return '';
  };
  Game.applyOutcome = function (o) {
    const s = S(), P = s.player; const res = { msgs: [], fight: null, npc: false, text: '' };
    if (o.check) {
      const c = Game.statCheck(o.check.stat, o.check.dc);
      res.msgs.push((c.ok ? '🎲 Tirada superada' : '🎲 Tirada fallida') + ' (' + D.STATS[o.check.stat].n + ' ' + c.roll + ' vs ' + c.dc + ')');
      const r = Game.applyOutcome(c.ok ? o.check.win : o.check.lose);
      r.msgs = res.msgs.concat(r.msgs); return r;
    }
    res.text = o.text || '';
    if (o.gold) { P.gold = Math.max(0, P.gold + o.gold); res.msgs.push((o.gold > 0 ? '🪙 +' : '🪙 ') + o.gold + ' ryo'); }
    if (o.hp) { if (o.hp > 0) Game.heal(o.hp, 0); else P.hp = Math.max(1, P.hp + o.hp); res.msgs.push('❤️ ' + (o.hp > 900 ? 'Vida restaurada' : (o.hp > 0 ? '+' : '') + o.hp + ' vida')); }
    if (o.en) { Game.heal(0, o.en); res.msgs.push('🔷 ' + (o.en > 900 ? 'Energía restaurada' : '+' + o.en + ' energía')); }
    if (o.honor) { Game.addHonor(o.honor); res.msgs.push((o.honor > 0 ? '🕊️ Honor +' : '🩸 Honor ') + o.honor); }
    if (o.fame) { P.fame = Math.max(0, P.fame + o.fame); res.msgs.push('📣 Fama ' + (o.fame > 0 ? '+' : '') + o.fame); }
    if (o.item) Object.keys(o.item).forEach((k) => { Game.addItem(k, o.item[k]); res.msgs.push(D.ITEMS[k].e + ' ' + (o.item[k] > 0 ? '+' : '') + o.item[k] + ' ' + D.ITEMS[k].n); });
    if (o.stat) Object.keys(o.stat).forEach((k) => { P.stats[k] += o.stat[k]; res.msgs.push('📈 ' + D.STATS[k].n + ' +' + o.stat[k]); });
    if (o.xp) res.msgs.push(...Game.gainXp(o.xp));
    if (o.steps) Game.advance(o.steps);
    if (o.reveal) { const r = Game.revealRandomPoi(); if (r) res.msgs.push('🗺️ Descubres: ' + r.name); }
    if (o.fight) res.fight = o.fight;
    if (o.npc) res.npc = true;
    Game.clampVitals();
    return res;
  };
  Game.revealRandomPoi = function () {
    const s = S(); const cand = s.world.pois.filter((p) => !p.hidden && !s.explored[p.y * s.world.w + p.x]);
    if (!cand.length) return null;
    const p = U.R.pick(cand); W.reveal(s, p.x, p.y, 2); p.revealed = true; return p;
  };

  /* ---------- encuentros ---------- */
  Game.regionTier = function (x, y) {
    const cap = S().world.pois[0], d = Math.abs(x - cap.x) + Math.abs(y - cap.y);
    return d > 26 ? 3 : d > 15 ? 2 : 1;
  };
  Game.zoneOf = (x, y) => W.ZONE[W.tileAt(S(), x, y)];
  Game.makeGroup = function (zone, tier, forceIds) {
    const P = S().player;
    if (forceIds) return forceIds.map((id) => ({ id, lvl: Math.max(1, P.level + U.R.ri(0, 1)) }));
    const cap = Math.min(tier, Math.floor(P.level / 3) + 1);
    let pool = Object.values(D.ENEMIES).filter((e) => !e.boss && e.tier <= cap && e.zones.includes(zone));
    if (!pool.length) pool = Object.values(D.ENEMIES).filter((e) => !e.boss && e.tier <= cap);
    const n = P.level >= 3 && U.R.chance(0.3) ? (U.R.chance(0.3) && P.level >= 5 ? 3 : 2) : 1;
    const first = U.R.pick(pool); const out = [];
    for (let i = 0; i < n; i++) { const e = i === 0 ? first : U.R.chance(0.6) ? first : U.R.pick(pool); out.push({ id: e.id, lvl: Math.max(1, P.level + U.R.ri(-1, 1) + (e.tier > 1 ? 0 : 0)) }); }
    return out;
  };
  Game.pickEvent = function (zone, town) {
    const s = S(), P = s.player;
    const zs = town ? ['town', 'any'] : [zone, 'any'];
    let pool = D.EVENTS.filter((e) => e.zones.some((z) => zs.includes(z)) && (!e.night || s.time.phase === 2) && !(s.flags.recent || []).includes(e.id));
    if (!pool.length) pool = D.EVENTS.filter((e) => e.zones.some((z) => zs.includes(z)));
    if (!pool.length) return null;
    const ev = U.R.pick(pool); s.flags.recent = (s.flags.recent || []).concat(ev.id).slice(-5);
    return ev;
  };
  Game.rollStepEncounter = function () {
    const s = S(), P = s.player; if (s.flags.cool > 0) return null;
    const t = W.tileAt(s, P.x, P.y), zone = W.ZONE[t];
    let p = [0, 0.03, 0.06, 0.09, 0.11, 0.025][t] || 0.05;
    if (s.time.phase === 2) p *= 1.5;
    if (!U.R.chance(p)) return null;
    s.flags.cool = 3;
    const tier = Game.regionTier(P.x, P.y);
    const r = U.R.r();
    if (r < 0.58) return { type: 'combat', group: Game.makeGroup(zone, tier), zone };
    if (r < 0.84) { const ev = Game.pickEvent(zone, false); return ev ? { type: 'event', ev } : null; }
    if (r < 0.92) return { type: 'traveler' };
    const g = U.R.ri(6, 22) * tier; const items = ['hierba', 'onigiri', 'pocion', 'dango', 'flor'];
    const it = U.R.chance(0.6) ? U.R.pick(items) : null;
    return { type: 'treasure', gold: g, item: it };
  };
  Game.step = function (dx, dy) {
    const s = S(), P = s.player; const nx = P.x + dx, ny = P.y + dy;
    const t = W.tileAt(s, nx, ny);
    if (t === 0) return { blocked: true, msg: nx < 0 || ny < 0 || nx >= s.world.w || ny >= s.world.h ? 'Es el fin del mundo conocido.' : 'El agua te cierra el paso.' };
    P.x = nx; P.y = ny; W.reveal(s, nx, ny, 4);
    const logs = Game.advance(t === 4 ? 2 : 1);
    const poi = W.poiAt(s, nx, ny);
    if (poi) { poi.revealed = true; return { poi, logs }; }
    return { enc: Game.rollStepEncounter(), logs };
  };
  Game.meetTraveler = function () {
    const s = S(), P = s.player, R = U.R;
    const near = W.nearestSettlement(s, P);
    const pref = P.prefs.interest;
    const g = pref === 'none' || pref === 'both' || R.chance(0.35) ? R.pick(['m', 'f']) : pref;
    const n = NPC.gen(R, { settle: near.type, home: near.id, gender: g, level: Game.regionTier(P.x, P.y) * 2 - 1, id: U.uid('t') });
    n.special = 'traveler';
    s.npcs[n.id] = n; near.npcs.push(n.id);
    return n;
  };

  /* ---------- recompensas de combate ---------- */
  Game.victory = function (c) {
    const P = S().player, out = [];
    let xp = 0, gold = 0; const drops = [];
    c.enemies.forEach((e) => {
      xp += e.xp; gold += e.gold + U.R.ri(0, Math.ceil(e.gold * 0.4));
      (e.drops || []).forEach(([id, p]) => { if (U.R.chance(p)) drops.push(id); });
      P.kills++;
      S().quests.forEach((q) => { if (q.status === 'active' && q.type === 'hunt' && q.target === e.id) { q.have = Math.min(q.need, q.have + 1); if (q.have >= q.need) { q.status = 'ready'; out.push('📜 Misión lista para entregar: ' + q.title); } } });
    });
    gold = Math.round(gold * (1 + Math.min(0.25, P.stats.car * 0.005)));
    P.gold += gold; out.unshift('🪙 +' + gold + ' ryo');
    out.push(...Game.gainXp(xp));
    drops.forEach((id) => { Game.addItem(id, 1); out.push(D.ITEMS[id].e + ' Botín: ' + D.ITEMS[id].n); });
    S().counters.fights++;
    return out;
  };
  Game.onBoss = function (id) {
    const s = S(), out = [];
    if (id === 'sombras') { s.main.done = true; s.main.stage = 4; Game.addHonor(15); s.player.fame += 20; out.push('🌅 ¡El Señor de las Sombras ha caído! La luz regresa a Kazehana.'); }
    return out;
  };

  /* ---------- misiones ---------- */
  Game.makeQuest = function (R, tier, giver) {
    const s = S(); const type = R.pick(['hunt', 'hunt', 'bring', 'visit']);
    const id = U.uid('q');
    if (type === 'hunt') {
      const pool = Object.values(D.ENEMIES).filter((e) => !e.boss && e.tier <= Math.max(1, Math.min(tier, 3)));
      const e = R.pick(pool); const need = R.ri(3, 5);
      return { id, kind: 'side', type, title: U.fill(R.pick(D.QUEST_TITLES.hunt), { e: e.n }), desc: 'Derrota a ' + need + ' ' + e.n + '.', target: e.id, need, have: 0, status: 'active', giver, reward: { gold: 35 + need * 14 * e.tier, xp: 18 * e.tier * need / 2 | 0 } };
    }
    if (type === 'bring') {
      const it = R.pick(['hierba', 'colmillo', 'hierba', 'cristal']); const need = R.ri(2, 4);
      return { id, kind: 'side', type, title: U.fill(R.pick(D.QUEST_TITLES.bring), { i: D.ITEMS[it].n }), desc: 'Entrega ' + need + ' × ' + D.ITEMS[it].n + '.', target: it, need, have: 0, status: 'active', giver, reward: { gold: 30 + need * D.ITEMS[it].price * 2, xp: 12 * tier * need / 2 | 0 } };
    }
    const cand = s.world.pois.filter((p) => !p.settle && !p.hidden);
    const p = R.pick(cand);
    return { id, kind: 'side', type: 'visit', title: U.fill(R.pick(D.QUEST_TITLES.visit), { p: p.name }), desc: 'Explora ' + p.name + ' y regresa con noticias.', target: p.id, need: 1, have: 0, status: 'active', giver, reward: { gold: 60 * p.tier, xp: 25 * p.tier } };
  };
  Game.board = function (poi) {
    const s = S(); let b = s.boards[poi.id];
    if (!b || s.time.day - b.day >= 6) {
      const R = U.R; b = { day: s.time.day, quests: [] };
      for (let i = 0; i < 4; i++) b.quests.push(Game.makeQuest(R, poi.tier, 'gremio'));
      s.boards[poi.id] = b;
    }
    return b;
  };
  Game.acceptQuest = function (poiId, qid) {
    const s = S(), b = s.boards[poiId]; const i = b.quests.findIndex((q) => q.id === qid); if (i < 0) return false;
    if (s.quests.filter((q) => q.status !== 'done' && q.kind === 'side').length >= 8) return false;
    const q = b.quests.splice(i, 1)[0];
    if (q.type === 'visit') { const p = W.poi(s, q.target); W.reveal(s, p.x, p.y, 1); p.revealed = true; }
    s.quests.push(q); Game.log('Aceptas la misión: ' + q.title, 'quest'); return true;
  };
  Game.questReady = function (q) {
    if (q.status === 'ready') return true;
    if (q.status === 'active' && q.type === 'bring') return Game.count(q.target) >= q.need;
    return false;
  };
  Game.turnIn = function (q) {
    const P = S().player; if (!Game.questReady(q)) return null;
    if (q.type === 'bring') Game.addItem(q.target, -q.need);
    q.status = 'done'; const r = q.reward || {}; const out = [];
    if (r.gold) { P.gold += r.gold; out.push('🪙 +' + r.gold + ' ryo'); }
    if (r.item) Object.keys(r.item).forEach((k) => { Game.addItem(k, r.item[k]); out.push(D.ITEMS[k].e + ' ' + D.ITEMS[k].n); });
    if (r.xp) out.push(...Game.gainXp(r.xp));
    if (q.giver && q.giver !== 'gremio' && S().npcs[q.giver]) { const n = S().npcs[q.giver]; n.affinity = Math.min(100, n.affinity + 8); n.trust += 4; out.push('💞 ' + n.name + ' te aprecia más'); n.mood = 'alegre'; }
    Game.addHonor(2); P.fame += 1; Game.log('Misión completada: ' + q.title, 'quest');
    return out;
  };
  Game.onVisit = function (poi) {
    S().quests.forEach((q) => { if (q.status === 'active' && q.type === 'visit' && q.target === poi.id) { q.status = 'ready'; Game.log('📜 Misión lista para entregar: ' + q.title, 'quest'); } });
  };

  /* ---------- mazmorras ---------- */
  Game.BOSS_BY_TYPE = { santuario: 'guardian', ruinas: 'quimera', cueva: 'oni_rey', mina: 'oni_rey', torre: 'espectro', bosque: 'espectro', guarida: 'sombras' };
  Game.dungeonCooldown = function (poi) { return Math.max(0, 8 - (S().time.day - poi.clearedDay)); };
  Game.enterDungeon = function (poi) {
    const s = S();
    const rooms = poi.type === 'guarida' ? 6 : poi.type === 'santuario' ? 4 : 3 + poi.tier;
    s.dungeon = { poi: poi.id, room: 0, rooms };
    Game.onVisit(poi); poi.revealed = true; return s.dungeon;
  };
  Game.dungeonRoom = function () {
    const s = S(), dg = s.dungeon, poi = W.poi(s, dg.poi), R = U.R;
    if (dg.room >= dg.rooms - 1) return { type: 'boss', enemy: Game.BOSS_BY_TYPE[poi.type] || 'oni_rey', poi };
    const kind = R.wpick(['combat', 'event', 'treasure', 'rest', 'trap'], (k) => ({ combat: 45, event: 15, treasure: 18, rest: 9, trap: 13 }[k]));
    if (kind === 'combat') {
      const zone = poi.type === 'torre' || poi.type === 'ruinas' ? 'camino' : poi.type === 'bosque' ? 'bosque' : 'montana';
      return { type: 'combat', group: Game.makeGroup(zone, poi.tier + 1) };
    }
    if (kind === 'event') { const ev = Game.pickEvent('bosque', false); return ev ? { type: 'event', ev } : { type: 'rest' }; }
    if (kind === 'treasure') return { type: 'treasure', gold: R.ri(15, 40) * (poi.tier + 1), item: R.pick(['pocion', 'elixir', 'esencia', 'cristal', 'hierba', 'antidoto']) };
    if (kind === 'rest') return { type: 'rest' };
    return { type: 'trap', dmg: R.ri(6, 12) + poi.tier * 5 };
  };
  Game.dungeonFinish = function () {
    const s = S(), dg = s.dungeon, poi = W.poi(s, dg.poi), P = s.player, out = [];
    const first = poi.clearedDay < 0;
    poi.clearedDay = s.time.day;
    const gold = 80 * (poi.tier + 1) + U.R.ri(0, 60); P.gold += gold; out.push('🪙 +' + gold + ' ryo del tesoro');
    out.push(...Game.gainXp(40 * (poi.tier + 1)));
    if (poi.type === 'santuario' && !poi.sealTaken) {
      poi.sealTaken = true; Game.addItem('sello', 1); s.main.seals++; out.push('🔰 Obtienes un Sello Ancestral (' + s.main.seals + '/3)');
      if (s.main.seals >= 3 && !s.main.lair) {
        s.main.lair = true; s.main.stage = 3; const lair = s.world.pois.find((p) => p.type === 'guarida'); lair.hidden = false; lair.revealed = true; W.reveal(s, lair.x, lair.y, 2);
        out.push('🌋 Los tres sellos reaccionan: ¡se revela la ' + lair.name + '!');
        const q = s.quests.find((x) => x.id === 'main2'); if (q) q.status = 'done';
        s.quests.push({ id: 'main3', kind: 'main', type: 'boss', title: 'El Señor de las Sombras', desc: 'Entra en la ' + lair.name + ' y derrota al Señor de las Sombras.', status: 'active', reward: {} });
      }
    }
    if (poi.type !== 'santuario' && U.R.chance(0.45)) { const it = U.R.pick(['katana_hierro', 'armadura_ligera', 'amuleto_jade', 'amuleto_viento', 'colgante_sabio', 'talisman', 'baston', 'pocion_mayor']); Game.addItem(it, 1); out.push(D.ITEMS[it].e + ' Hallazgo: ' + D.ITEMS[it].n); }
    s.dungeon = null; out.forEach((t) => Game.log(t, 'sys')); return out;
  };

  /* ---------- descanso, entrenamiento y servicios ---------- */
  Game.rest = function (kind, poi) {
    const s = S(), P = s.player, d = Game.derived(P); const out = [];
    if (kind === 'inn') {
      const cost = D.SETTLE[poi.type].inn;
      if (P.gold < cost) return { ok: false, msg: 'La posada cuesta ' + cost + ' ryo.' };
      P.gold -= cost; Game.skipToMorning(); P.hp = d.maxHp; P.en = d.maxEn;
      return { ok: true, msg: '🛏️ Duermes en la posada (' + cost + ' ryo). Te despiertas completamente descansado.' };
    }
    if (kind === 'home') { Game.skipToMorning(); P.hp = d.maxHp; P.en = d.maxEn; return { ok: true, msg: '🏠 Duermes en tu hogar. Te despiertas con las fuerzas renovadas.' }; }
    if (kind === 'camp') {
      Game.skipToMorning(); Game.heal(Math.round(d.maxHp * 0.6), Math.round(d.maxEn * 0.6));
      return { ok: true, msg: '⛺ Acampas y descansas. Recuperas parte de tus fuerzas.', ambush: U.R.chance(0.25) };
    }
    return { ok: false, msg: '' };
  };
  Game.trainCost = (P, stat) => 25 + P.stats[stat] * 12;
  Game.train = function (stat, trainerAff) {
    const P = S().player, cost = Game.trainCost(P, stat);
    if (P.gold < cost) return { ok: false, msg: 'Necesitas ' + cost + ' ryo.' };
    if (P.stats[stat] >= 30) return { ok: false, msg: 'Ya has llegado al límite de tu entrenamiento.' };
    P.gold -= cost; Game.advance(D.STEPS_PHASE);
    const win = U.R.chance(0.6 + Math.min(0.2, (trainerAff || 0) / 400));
    if (win) { P.stats[stat]++; Game.clampVitals(); return { ok: true, msg: '🥋 Entrenas toda la jornada. ' + D.STATS[stat].n + ' +1' }; }
    return { ok: true, msg: '🥋 Hoy no hay progreso notable, pero ganas algo de experiencia.', xp: Game.gainXp(6) };
  };
  Game.rankCost = (P) => 160 * (P.powerRank + 1) * (P.powerRank + 1);
  Game.rankUp = function () {
    const P = S().player, c = Game.rankCost(P);
    if (P.powerRank >= 5) return { ok: false, msg: 'Tu poder ha alcanzado su máximo rango.' };
    if (P.level < 3 * (P.powerRank + 1)) return { ok: false, msg: 'Necesitas nivel ' + 3 * (P.powerRank + 1) + ' para el siguiente rango.' };
    if (P.gold < c) return { ok: false, msg: 'Necesitas ' + c + ' ryo.' };
    P.gold -= c; P.powerRank++; Game.advance(D.STEPS_PHASE);
    return { ok: true, msg: '🔮 Tu poder asciende al rango ' + P.powerRank + ' (+8% de daño por rango).' };
  };
  Game.buyHouse = function (poi) {
    const s = S(), P = s.player, cost = D.SETTLE[poi.type].house;
    if (s.family.home) return { ok: false, msg: 'Ya tienes un hogar.' };
    if (P.gold < cost) return { ok: false, msg: 'Necesitas ' + cost + ' ryo.' };
    P.gold -= cost; s.family.home = poi.id;
    const sp = P.spouse && s.npcs[P.spouse]; if (sp) { sp.home = poi.id; if (!poi.npcs.includes(sp.id)) poi.npcs.push(sp.id); }
    Game.log('Compras una casa en ' + poi.name + '.', 'story');
    return { ok: true, msg: '🏠 ¡Ya tienes un hogar en ' + poi.name + '!' };
  };

  /* ---------- derrota / herencia ---------- */
  Game.heirs = function () { const s = S(); return s.family.children.filter((c) => Game.childAge(c) >= 14); };
  Game.childAge = (c) => Math.floor((S().time.day - c.birthDay) / D.DAYS_YEAR);
  Game.defeat = function () {
    const s = S(), P = s.player;
    if (P.permadeath) return { over: true, heirs: Game.heirs() };
    const lost = Math.floor(P.gold * 0.3); P.gold -= lost;
    const near = s.family.home ? W.poi(s, s.family.home) : W.nearestSettlement(s, P);
    P.x = near.x; P.y = near.y; W.reveal(s, P.x, P.y, 3);
    Game.skipToMorning(); const d = Game.derived(P); P.hp = Math.round(d.maxHp * 0.5); P.en = Math.round(d.maxEn * 0.5);
    s.dungeon = null;
    return { over: false, msg: 'Despiertas en ' + near.name + ', vendado y dolorido. Has perdido ' + lost + ' ryo.', poi: near };
  };
  Game.continueAsHeir = function (childId) {
    const s = S(), old = s.player, c = s.family.children.find((x) => x.id === childId); if (!c) return false;
    const heirLook = Object.assign({}, c.look, { age: Math.max(18, Game.childAge(c)), accs: c.look.accs || [] });
    const P = Object.assign({}, old, {
      name: c.name, gender: c.gender, age0: Game.childAge(c) - Math.floor((s.time.day - 1) / D.DAYS_YEAR), look: heirLook, build: old.build, buildTags: heirLook.buildTags,
      level: Math.max(1, Math.floor(old.level * 0.6)), xp: 0, points: 0, honor: Math.round(old.honor * 0.5), fame: Math.round(old.fame * 0.3), spouse: null, kills: 0,
      stats: { fue: 5 + Math.floor((old.stats.fue - 5) / 2), agi: 5 + Math.floor((old.stats.agi - 5) / 2), men: 5 + Math.floor((old.stats.men - 5) / 2), car: 5 + Math.floor((old.stats.car - 5) / 2), esp: 5 + Math.floor((old.stats.esp - 5) / 2) },
      gold: Math.floor(old.gold * 0.6) + 200, power: c.power || old.power, powerRank: 0, traits: [c.trait ? 'curioso' : 'curioso'], equip: { arma: null, armadura: null, amuleto: null }, inv: { onigiri: 3, pocion: 2, bokken: 1 },
    });
    P.equip.arma = 'bokken'; P.looksBonus = 0;
    s.family.children = s.family.children.filter((x) => x.id !== childId); s.player = P; s.gen++;
    const home = s.family.home ? W.poi(s, s.family.home) : W.poi(s, old.home); P.x = home.x; P.y = home.y;
    const d = Game.derived(P); P.hp = d.maxHp; P.en = d.maxEn; s.quests = s.quests.filter((q) => q.kind === 'main'); s.dungeon = null;
    Game.log('Una nueva generación: ahora juegas como ' + P.name + ', hij' + (c.gender === 'm' ? 'o' : 'a') + ' de ' + old.name + '.', 'story');
    return true;
  };

  /* ---------- guardado ---------- */
  Game.save = function (slot) {
    const s = S(); if (!s) return Promise.resolve();
    const copy = Object.assign({}, s, { combat: null, savedAt: Date.now() });
    return G.Storage.save(slot || 'auto', copy);
  };
  Game.load = async function (slot) {
    const d = await G.Storage.load(slot); if (!d) return false;
    d.combat = null; G.S = d; return true;
  };
})((window.G = window.G || {}));
