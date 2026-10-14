/* KAZEHANA · interfaz (núcleo): título, creador de personaje, mapa en canvas, HUD y menús */
(function (G) {
  'use strict';
  const D = G.D, U = G.U, W = G.World, NPC = G.NPC, Game = G.Game, esc = U.esc;
  const UI = (G.UI = { acts: {}, mode: 'title', cc: null, walk: null, steps: 0 });
  const $ = (id) => document.getElementById(id);
  UI.$ = $;

  /* ---------- helpers de maquetación ---------- */
  UI.btn = function (label, act, a, b, o) {
    o = o || {};
    return '<button class="btn ' + (o.cls || '') + '" data-act="' + act + '"' + (a != null ? ' data-a="' + esc(a) + '"' : '') + (b != null ? ' data-b="' + esc(b) + '"' : '') + (o.off ? ' disabled' : '') + (o.title ? ' title="' + esc(o.title) + '"' : '') + '>' + label + '</button>';
  };
  UI.bar = (v, max, cls) => '<div class="bar ' + cls + '"><i style="width:' + U.pct(v, max) + '%"></i><span>' + Math.round(v) + '/' + max + '</span></div>';
  UI.panel = function (title, body, cls) {
    $('panel').className = 'panel ' + (cls || '');
    $('panel').innerHTML = '<div class="panel-head"><h2>' + title + '</h2></div><div class="panel-body">' + body + '</div>';
    $('panel').scrollTop = 0;
  };
  UI.toast = function (t) {
    const el = document.createElement('div'); el.className = 'toast-item'; el.innerHTML = t; $('toast').appendChild(el);
    setTimeout(() => el.classList.add('out'), 3200); setTimeout(() => el.remove(), 3700);
  };
  UI.toasts = (arr) => (arr || []).forEach((t, i) => setTimeout(() => UI.toast(t), i * 250));
  UI.list = (arr) => (arr && arr.length ? '<ul class="eff">' + arr.map((t) => '<li>' + t + '</li>').join('') + '</ul>' : '');
  UI.screen = function (id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    UI.mode = id;
  };
  UI.pName = (n) => (n.met ? esc(n.name + ' ' + n.surname) : esc(U.cap(NPC.shortDesc(n))));

  /* ---------- eventos globales ---------- */
  UI.init = function () {
    G.Settings.load();
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
      const f = UI.acts[b.dataset.act];
      if (f) { G.Sfx.play('click'); f(b.dataset.a, b.dataset.b, b); }
    });
    document.addEventListener('input', (e) => {
      const t = e.target; if (!t.dataset || !t.dataset.bind) return;
      const path = t.dataset.bind.split('.'); let o = UI.cc; for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
      o[path[path.length - 1]] = t.type === 'number' ? parseInt(t.value, 10) || 18 : t.value;
      UI.updatePreview();
      if (UI.cc.step === 0) { const nb = document.querySelector('[data-act=cc_next]'); if (nb) nb.disabled = !UI.cc.name.trim(); }
    });
    document.addEventListener('keydown', (e) => {
      if (UI.mode !== 'game') return;
      if (e.target.matches('input,textarea')) return;
      if (e.key === 'Escape') { UI.closeModal(); return; }
      const m = { ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0] }[e.key];
      if (m) { e.preventDefault(); UI.stopWalk(); UI.move(m[0], m[1]); }
      const tabs = { c: 'char', i: 'inv', m: 'quests', r: 'rel', f: 'family', n: 'map', j: 'diary' }[e.key];
      if (tabs && !e.ctrlKey && !e.metaKey) UI.openModal(tabs);
    });
    const cv = $('map');
    cv.addEventListener('click', (e) => UI.mapClick(e));
    window.addEventListener('resize', () => UI.draw());
    setInterval(() => { if (UI.mode === 'game' && G.S) UI.draw(true); }, 450);
    UI.showTitle();
  };

  /* ---------- título ---------- */
  UI.showTitle = async function () {
    UI.screen('title'); UI.stopWalk();
    const wrap = $('title-saves'); wrap.innerHTML = '<p class="muted">Buscando partidas…</p>';
    const rows = [];
    for (const sl of G.Storage.SLOTS) { const s = await G.Storage.summary(sl); if (s) rows.push(s); }
    wrap.innerHTML = rows.length ? rows.map((s) => '<div class="saverow"><div><b>' + esc(s.name) + '</b> · nv. ' + s.level + ' · día ' + s.day + '<small>' + (s.slot === 'auto' ? 'Autoguardado' : 'Ranura ' + s.slot.slice(-1)) + (s.ts ? ' · ' + new Date(s.ts).toLocaleString() : '') + '</small></div>' + UI.btn('Continuar', 'loadslot', s.slot, null, { cls: 'primary' }) + UI.btn('🗑️', 'delslot', s.slot, null, { cls: 'ghost', title: 'Borrar' }) + '</div>').join('') : '<p class="muted">Aún no hay partidas guardadas. ¡Empieza una nueva aventura!</p>';
    $('snd-title').textContent = G.Settings.data.sound ? '🔊 Sonido activado' : '🔇 Sonido apagado';
  };
  UI.acts.newgame = () => { UI.startCreate(); };
  UI.acts.loadslot = async (slot) => { if (await Game.load(slot)) { UI.enterGame(); } else UI.toast('No se pudo cargar esa partida.'); };
  UI.acts.delslot = async (slot) => { if (confirm('¿Borrar esta partida para siempre?')) { await G.Storage.remove(slot); UI.showTitle(); } };
  UI.acts.sound = () => { const on = G.Sfx.toggle(); $('snd-title').textContent = on ? '🔊 Sonido activado' : '🔇 Sonido apagado'; if ($('snd-hud')) $('snd-hud').textContent = on ? '🔊' : '🔇'; G.Sfx.play('click'); };
  UI.acts.import = () => $('file-import').click();
  UI.importFile = function (file) {
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); if (!d.player || !d.world) throw 0; d.combat = null; G.S = d; UI.enterGame(); UI.toast('Partida importada.'); } catch (e) { UI.toast('Archivo no válido.'); } };
    r.readAsText(file);
  };

  /* ---------- creador de personaje ---------- */
  const STEPS = ['Identidad', 'Descríbete', 'Aspecto', 'Rasgos', 'Origen', 'Poder', 'Corazón', 'Resumen'];
  UI.startCreate = function () {
    const hc = D.HAIR_COLORS[1], ec = D.EYE_COLORS[0];
    UI.cc = { step: 0, name: '', gender: 'f', age: 18, self: { look: '', pers: '', story: '' },
      look: { skin: D.SKINS[1], hairColor: hc.hex, hairName: hc.n, hairStyle: 'long', eye: ec.hex, eyeName: ec.n, outfit: D.OUTFITS[0], outfit2: '#f4d8a0', accs: [] },
      build: 'atletico', height: 'medio', traits: [], alloc: { fue: 0, agi: 0, men: 0, car: 0, esp: 0 }, left: 8, origin: 'aldea', power: 'fuego', interest: 'both', types: [], permadeath: false, parsed: [] };
    UI.screen('create'); UI.renderCreate();
  };
  UI.ccEntity = function () {
    const c = UI.cc;
    return { id: 'preview', look: Object.assign({}, c.look, { gender: c.gender, age: c.age, grey: 0, buildTags: NPC.buildTagsFor(c.gender, c.build, c.height), build: c.build, height: c.height, eyeShape: 'soft' }) };
  };
  UI.updatePreview = function () { const el = $('cc-preview'); if (el) el.innerHTML = G.Port.html(UI.ccEntity(), 'alegre', { w: 190 }); };
  const sw = (list, cur, act, fnHex) => '<div class="swatches">' + list.map((x) => { const hx = fnHex(x); return '<button class="sw ' + (cur === hx ? 'on' : '') + '" style="background:' + hx + '" data-act="' + act + '" data-a="' + (x.id || hx) + '" aria-label="color"></button>'; }).join('') + '</div>';
  UI.renderCreate = function () {
    const c = UI.cc, st = c.step; let body = '';
    const chip = (label, on, act, a, b) => '<button class="chip ' + (on ? 'on' : '') + '" data-act="' + act + '" data-a="' + esc(a) + '"' + (b != null ? ' data-b="' + esc(b) + '"' : '') + '>' + label + '</button>';
    if (st === 0) {
      body = '<h3>¿Quién eres?</h3><label>Tu nombre<input type="text" maxlength="18" data-bind="name" value="' + esc(c.name) + '" placeholder="Ej.: Akira, Sakura…" autocomplete="off"></label>'
        + '<div class="row"><div><span class="lbl">Género</span><div class="chips">' + chip('♂ Hombre', c.gender === 'm', 'cc_gender', 'm') + chip('♀ Mujer', c.gender === 'f', 'cc_gender', 'f') + '</div></div>'
        + '<label>Edad inicial (18–30)<input type="number" min="18" max="30" data-bind="age" value="' + c.age + '"></label></div>'
        + '<p class="hint">Todos los personajes del juego son adultos. Tu edad aumenta un año cada ' + D.DAYS_YEAR + ' días de juego.</p>';
    } else if (st === 1) {
      body = '<h3>Descríbete</h3><p class="hint">Escribe cómo eres con tus palabras. Los habitantes del mundo recordarán detalles de lo que escribas y yo intentaré adaptar tu aspecto (pelo, ojos, complexión…).</p>'
        + '<label>Tu aspecto físico<textarea rows="3" data-bind="self.look" placeholder="Ej.: Soy alta, de pelo rojo largo y ojos verdes, con pecas y cuerpo atlético…">' + esc(c.self.look) + '</textarea></label>'
        + '<label>Tu personalidad<textarea rows="3" data-bind="self.pers" placeholder="Ej.: Tranquila pero cabezota, odio la injusticia, me río de todo…">' + esc(c.self.pers) + '</textarea></label>'
        + '<label>Tu historia<textarea rows="3" data-bind="self.story" placeholder="Ej.: Perdí a mis padres de niña y juré hacerme fuerte…">' + esc(c.self.story) + '</textarea></label>'
        + UI.btn('🔍 Interpretar mi descripción', 'cc_parse', null, null, { cls: 'ghost' }) + (c.parsed.length ? '<p class="hint ok">He entendido: ' + c.parsed.map(esc).join(', ') + '. Puedes ajustarlo en el siguiente paso.</p>' : '');
    } else if (st === 2) {
      const bl = D.PLAYER_BUILDS[c.gender];
      body = '<h3>Tu aspecto</h3><span class="lbl">Peinado</span><div class="chips">' + Object.keys(D.HAIR_STYLES).filter((k) => !(c.gender === 'm' && ['twin', 'bun'].includes(k))).map((k) => chip(D.HAIR_STYLES[k], c.look.hairStyle === k, 'cc_pick', 'hairStyle', k)).join('') + '</div>'
        + '<span class="lbl">Color de pelo</span>' + sw(D.HAIR_COLORS, c.look.hairColor, 'cc_hair', (x) => x.hex)
        + '<span class="lbl">Color de ojos</span>' + sw(D.EYE_COLORS, c.look.eye, 'cc_eye', (x) => x.hex)
        + '<span class="lbl">Piel</span>' + sw(D.SKINS.map((s) => ({ id: s, hex: s })), c.look.skin, 'cc_skin', (x) => x.hex)
        + '<span class="lbl">Ropa</span>' + sw(D.OUTFITS.map((s) => ({ id: s, hex: s })), c.look.outfit, 'cc_outfit', (x) => x.hex)
        + '<span class="lbl">Complexión</span><div class="chips">' + bl.map((k) => chip(D.BUILD_LABELS[k], c.build === k, 'cc_build', k)).join('') + '</div>'
        + '<span class="lbl">Estatura</span><div class="chips">' + [['bajo', 'Baja'], ['medio', 'Media'], ['alto', 'Alta'], ['muyalto', 'Muy alta']].map(([k, l]) => chip(l, c.height === k, 'cc_height', k)).join('') + '</div>'
        + '<span class="lbl">Detalles</span><div class="chips">' + ['gafas', 'cicatriz', 'pecas', 'pendientes', 'lunar', 'cinta'].concat(c.gender === 'm' ? ['barba'] : []).map((k) => chip(k, c.look.accs.includes(k), 'cc_acc', k)).join('') + '</div>';
    } else if (st === 3) {
      body = '<h3>Rasgos y atributos</h3><span class="lbl">Elige hasta 2 rasgos</span><div class="cards small">' + Object.keys(D.TRAITS).map((k) => '<button class="card ' + (c.traits.includes(k) ? 'on' : '') + '" data-act="cc_trait" data-a="' + k + '"><b>' + D.TRAITS[k].e + ' ' + D.TRAITS[k].n + '</b><small>' + D.TRAITS[k].d + '</small></button>').join('') + '</div>'
        + '<span class="lbl">Reparte ' + c.left + ' puntos <small>(base 5)</small></span><div class="stats-alloc">' + Object.keys(D.STATS).map((k) => '<div class="srow"><span>' + D.STATS[k].e + ' ' + D.STATS[k].n + '<small>' + D.STATS[k].d + '</small></span><span class="sctl">' + UI.btn('−', 'cc_alloc', k, '-1', { cls: 'mini', off: !c.alloc[k] }) + '<b>' + (5 + c.alloc[k]) + '</b>' + UI.btn('+', 'cc_alloc', k, '1', { cls: 'mini', off: !c.left }) + '</span></div>').join('') + '</div>';
    } else if (st === 4) {
      body = '<h3>¿De dónde vienes?</h3><p class="hint">Define dónde empiezas, tu dinero inicial y un pequeño bonus.</p><div class="cards">' + Object.keys(D.ORIGINS).map((k) => { const o = D.ORIGINS[k]; return '<button class="card ' + (c.origin === k ? 'on' : '') + '" data-act="cc_origin" data-a="' + k + '"><b>' + o.e + ' ' + o.n + '</b><small>' + o.d + '</small><em>' + (Object.keys(o.bonus).map((s) => '+' + o.bonus[s] + ' ' + D.STATS[s].n).join(', ') || 'Sorpresa') + ' · ' + o.gold + ' ryo</em></button>'; }).join('') + '</div>';
    } else if (st === 5) {
      body = '<h3>Tu poder</h3><p class="hint">Cada poder tiene cinco técnicas que se desbloquean al subir de nivel.</p><div class="cards">' + Object.keys(D.POWERS).map((k) => { const p = D.POWERS[k]; return '<button class="card ' + (c.power === k ? 'on' : '') + '" data-act="cc_power" data-a="' + k + '" style="--pc:' + p.col + '"><b>' + p.e + ' ' + p.n + '</b><small>' + p.d + '</small><em>' + p.skills.slice(0, 3).map((s) => s.n).join(' · ') + '…</em></button>'; }).join('') + '</div>';
    } else if (st === 6) {
      body = '<h3>Tu corazón</h3><p class="hint">Define a quién puedes querer en este mundo. Solo hay personajes adultos; los romances llevan su tiempo y no son explícitos.</p>'
        + '<span class="lbl">Te atraen…</span><div class="chips">' + [['m', 'Hombres'], ['f', 'Mujeres'], ['both', 'Ambos'], ['none', 'Nadie (solo amistad)']].map(([k, l]) => chip(l, c.interest === k, 'cc_interest', k)).join('') + '</div>'
        + (c.interest !== 'none' ? '<span class="lbl">Tu tipo físico <small>(hasta 2)</small></span><div class="chips">' + D.TYPES.map((t) => chip(t.n, c.types.includes(t.id), 'cc_type', t.id)).join('') + '</div>' : '')
        + '<span class="lbl">Modo de juego</span><div class="chips">' + chip('Derrota normal (despiertas en un pueblo)', !c.permadeath, 'cc_perma', '0') + chip('Muerte permanente (heredan tus hijos)', c.permadeath, 'cc_perma', '1') + '</div>';
    } else {
      const o = D.ORIGINS[c.origin], p = D.POWERS[c.power];
      body = '<h3>Resumen</h3><div class="summary"><p><b>' + esc(c.name || 'Sin nombre') + '</b> · ' + (c.gender === 'm' ? 'hombre' : 'mujer') + ' de ' + c.age + ' años</p><p>' + o.e + ' Origen: ' + o.n + ' · ' + p.e + ' Poder: ' + p.n + '</p><p>Rasgos: ' + (c.traits.map((t) => D.TRAITS[t].n).join(', ') || 'ninguno') + '</p><p>Atributos: ' + Object.keys(D.STATS).map((k) => D.STATS[k].n + ' ' + (5 + c.alloc[k])).join(' · ') + '</p><p>Atracción: ' + ({ m: 'hombres', f: 'mujeres', both: 'ambos', none: 'nadie' }[c.interest]) + (c.types.length ? ' (tipo: ' + c.types.join(', ') + ')' : '') + '</p>' + (c.self.story ? '<p class="quote">«' + esc(c.self.story.slice(0, 220)) + '»</p>' : '') + '</div>';
      if (!c.name.trim()) body += '<p class="hint warn">Falta tu nombre (paso 1).</p>';
    }
    const nav = '<div class="wiz-nav">' + UI.btn('← Atrás', 'cc_back', null, null, { cls: 'ghost', off: st === 0 }) + (st < STEPS.length - 1 ? UI.btn('Siguiente →', 'cc_next', null, null, { cls: 'primary', off: st === 0 && !c.name.trim() }) : UI.btn('⛩️ Comenzar aventura', 'cc_start', null, null, { cls: 'primary big', off: !c.name.trim() })) + '</div>';
    $('create-body').innerHTML = '<ol class="steps">' + STEPS.map((s, i) => '<li class="' + (i === st ? 'on' : i < st ? 'done' : '') + '">' + s + '</li>').join('') + '</ol>' + body + nav;
    UI.updatePreview();
  };
  const A = UI.acts;
  A.cc_gender = (g) => { const c = UI.cc; c.gender = g; c.build = D.PLAYER_BUILDS[g][0]; if (g === 'm') { c.look.hairStyle = 'short'; c.look.accs = c.look.accs.filter((a) => a !== 'pendientes'); } else { c.look.hairStyle = 'long'; c.look.accs = c.look.accs.filter((a) => a !== 'barba'); } UI.renderCreate(); };
  A.cc_pick = (k, v) => { UI.cc.look[k] = v; UI.renderCreate(); };
  A.cc_hair = (id) => { const h = D.HAIR_COLORS.find((x) => x.id === id); UI.cc.look.hairColor = h.hex; UI.cc.look.hairName = h.n; UI.renderCreate(); };
  A.cc_eye = (id) => { const h = D.EYE_COLORS.find((x) => x.id === id); UI.cc.look.eye = h.hex; UI.cc.look.eyeName = h.n; UI.renderCreate(); };
  A.cc_skin = (v) => { UI.cc.look.skin = v; UI.renderCreate(); };
  A.cc_outfit = (v) => { UI.cc.look.outfit = v; UI.renderCreate(); };
  A.cc_build = (v) => { UI.cc.build = v; UI.renderCreate(); };
  A.cc_height = (v) => { UI.cc.height = v; UI.renderCreate(); };
  A.cc_acc = (v) => { const a = UI.cc.look.accs, i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); UI.renderCreate(); };
  A.cc_trait = (k) => { const t = UI.cc.traits, i = t.indexOf(k); if (i >= 0) t.splice(i, 1); else if (t.length < 2) t.push(k); else UI.toast('Máximo 2 rasgos.'); UI.renderCreate(); };
  A.cc_alloc = (k, d) => { const c = UI.cc; d = parseInt(d, 10); if (d > 0 && !c.left) return; if (d < 0 && !c.alloc[k]) return; c.alloc[k] += d; c.left -= d; UI.renderCreate(); };
  A.cc_origin = (k) => { UI.cc.origin = k; UI.renderCreate(); };
  A.cc_power = (k) => { UI.cc.power = k; UI.renderCreate(); };
  A.cc_interest = (k) => { UI.cc.interest = k; UI.renderCreate(); };
  A.cc_type = (k) => { const t = UI.cc.types, i = t.indexOf(k); if (i >= 0) t.splice(i, 1); else if (t.length < 2) t.push(k); else UI.toast('Máximo 2 tipos.'); UI.renderCreate(); };
  A.cc_perma = (v) => { UI.cc.permadeath = v === '1'; UI.renderCreate(); };
  A.cc_back = () => { UI.cc.step = Math.max(0, UI.cc.step - 1); UI.renderCreate(); };
  A.cc_next = () => { if (UI.cc.step === 1) A.cc_parse(true); UI.cc.step = Math.min(STEPS.length - 1, UI.cc.step + 1); UI.renderCreate(); };
  A.cc_parse = (silent) => {
    const c = UI.cc, p = NPC.parseSelf(c.self.look + ' ' + c.self.pers + ' ' + c.self.story); const found = [];
    if (p.hair) { const h = D.HAIR_COLORS.find((x) => x.id === p.hair); c.look.hairColor = h.hex; c.look.hairName = h.n; found.push('pelo ' + h.n); }
    if (p.eye) { const h = D.EYE_COLORS.find((x) => x.id === p.eye); c.look.eye = h.hex; c.look.eyeName = h.n; found.push('ojos ' + h.n); }
    if (p.build && D.PLAYER_BUILDS[c.gender].includes(p.build)) { c.build = p.build; found.push('complexión ' + D.BUILD_LABELS[p.build].toLowerCase()); }
    if (p.height) { c.height = p.height; found.push('estatura ' + p.height); }
    if (p.style && D.HAIR_STYLES[p.style] && !(c.gender === 'm' && ['twin', 'bun'].includes(p.style))) { c.look.hairStyle = p.style; found.push('peinado ' + D.HAIR_STYLES[p.style]); }
    (p.accs || []).forEach((a) => { if (!(a === 'barba' && c.gender !== 'm') && !c.look.accs.includes(a)) { c.look.accs.push(a); found.push(a); } });
    c.parsed = found; if (silent !== true) { UI.renderCreate(); if (!found.length) UI.toast('No he detectado rasgos concretos; puedes elegirlos a mano.'); }
  };
  A.cc_start = () => {
    const c = UI.cc; if (!c.name.trim()) return;
    const stats = {}; Object.keys(D.STATS).forEach((k) => (stats[k] = 5 + c.alloc[k]));
    const look = Object.assign({}, c.look, { outfit2: c.look.outfit2 });
    Game.newGame({ name: c.name.trim(), gender: c.gender, age: c.age, self: c.self, look, build: c.build, height: c.height, traits: c.traits, stats, origin: c.origin, power: c.power, interest: c.interest, types: c.types, permadeath: c.permadeath });
    UI.enterGame(true);
  };

  /* ---------- entrada al juego ---------- */
  UI.enterGame = function (fresh) {
    UI.screen('game'); UI.stopWalk(); UI.hud(); UI.draw();
    const s = G.S, poi = W.poiAt(s, s.player.x, s.player.y);
    if (s.family && s.dungeon) UI.viewDungeon(); else if (poi) UI.viewPoi(poi); else UI.viewExplore();
    if (fresh) { UI.viewIntro(); }
    UI.autosave();
  };
  UI.autosave = function () { Game.save('auto'); };

  /* ---------- HUD ---------- */
  UI.hud = function () {
    const s = G.S; if (!s) return; const P = s.player, d = Game.derived(P), ph = D.PHASES[s.time.phase];
    $('hud').innerHTML = '<div class="hud-id"><b>' + esc(P.name) + '</b><small>Nv. ' + P.level + ' · ' + Game.age(P) + ' años</small></div>'
      + '<div class="hud-bars">' + UI.bar(P.hp, d.maxHp, 'hp') + UI.bar(P.en, d.maxEn, 'en') + '<div class="bar xp"><i style="width:' + U.pct(P.xp, Game.xpNeed(P.level)) + '%"></i><span>XP ' + P.xp + '/' + Game.xpNeed(P.level) + '</span></div></div>'
      + '<div class="hud-meta"><span title="Dinero">🪙 ' + P.gold + '</span><span title="Fecha">' + ph.e + ' Día ' + s.time.day + ' · ' + D.SEASON_E[Game.season()] + ' ' + D.SEASONS[Game.season()] + '</span><span title="Honor">⚖️ ' + D.honorTitle(P.honor) + '</span></div>'
      + '<div class="hud-btns">' + (P.points ? '<button class="btn mini glow" data-act="tab" data-a="char">⬆️ ' + P.points + ' pts</button>' : '') + '<button class="btn mini" id="snd-hud" data-act="sound" title="Sonido">' + (G.Settings.data.sound ? '🔊' : '🔇') + '</button><button class="btn mini" data-act="tab" data-a="sys" title="Menú">☰</button></div>';
  };
  A.tab = (t) => UI.openModal(t);

  /* ---------- Mapa (canvas) ---------- */
  const PAL = [
    { grass: '#6fbf73', forest: '#3f8f55', sand: '#ead9a2', mount: '#8d8798', water: '#4a8fd0', road: '#cdae72', tree: '#2e7a46' },
    { grass: '#5cb460', forest: '#2f7d45', sand: '#f0dc9c', mount: '#8a8493', water: '#3e86cf', road: '#c8a86a', tree: '#236b3a' },
    { grass: '#a3b65c', forest: '#c27a30', sand: '#e3cf98', mount: '#8f8190', water: '#4a85b8', road: '#c9a56a', tree: '#b4622a' },
    { grass: '#dfe9ee', forest: '#8fb3a8', sand: '#e8e4d8', mount: '#c9cdd8', water: '#6aa0c8', road: '#bfb7a4', tree: '#6f9a8e' },
  ];
  const VW = 15, VH = 11, TS = 32;
  function cam() {
    const s = G.S, P = s.player;
    return { x: U.clamp(P.x - Math.floor(VW / 2), 0, Math.max(0, s.world.w - VW)), y: U.clamp(P.y - Math.floor(VH / 2), 0, Math.max(0, s.world.h - VH)) };
  }
  UI.draw = function (anim) {
    const s = G.S; if (!s || UI.mode !== 'game') return; const cv = $('map'); if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    cv.width = VW * TS; cv.height = VH * TS;
    const pal = PAL[Game.season()], c = cam(), w = s.world.w, P = s.player, t = Date.now() / 450;
    ctx.imageSmoothingEnabled = false; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let ty = 0; ty < VH; ty++) for (let tx = 0; tx < VW; tx++) {
      const x = c.x + tx, y = c.y + ty, px = tx * TS, py = ty * TS, i = y * w + x;
      if (x >= w || y >= s.world.h) { ctx.fillStyle = '#0a0916'; ctx.fillRect(px, py, TS, TS); continue; }
      if (!s.explored[i]) { ctx.fillStyle = '#0f0c20'; ctx.fillRect(px, py, TS, TS); ctx.fillStyle = 'rgba(255,255,255,.025)'; ctx.fillRect(px + 8, py + 8, 3, 3); continue; }
      const tl = s.world.tiles[i], h = U.hash(x + ',' + y);
      const base = [pal.water, pal.sand, pal.grass, pal.forest, pal.mount, pal.road][tl];
      ctx.fillStyle = base; ctx.fillRect(px, py, TS, TS);
      if (tl === 0) { ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2; ctx.beginPath(); const o = Math.sin(t + (h % 7)) * 3; ctx.moveTo(px + 5, py + 12 + o); ctx.quadraticCurveTo(px + 12, py + 6 + o, px + 19, py + 12 + o); ctx.stroke(); }
      else if (tl === 2) { if (h % 5 === 0) { ctx.fillStyle = Game.season() === 0 ? '#f8b4d0' : Game.season() === 1 ? '#fff2a0' : 'rgba(0,0,0,.08)'; ctx.fillRect(px + (h % 20) + 4, py + ((h >> 3) % 20) + 4, 3, 3); } }
      else if (tl === 3) { for (let k = 0; k < 2; k++) { const ox = 6 + k * 14 + (h % 4), oy = 8 + (k * 9) + ((h >> 2) % 4); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(px + ox - 1, py + oy + 8, 3, 6); ctx.fillStyle = pal.tree; ctx.beginPath(); ctx.arc(px + ox, py + oy, 8, 0, 6.3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(px + ox - 2, py + oy - 2, 3, 0, 6.3); ctx.fill(); } }
      else if (tl === 4) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.moveTo(px + 3, py + 28); ctx.lineTo(px + 16, py + 5); ctx.lineTo(px + 29, py + 28); ctx.fill(); ctx.fillStyle = Game.season() === 3 ? '#fff' : 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(px + 12, py + 12); ctx.lineTo(px + 16, py + 5); ctx.lineTo(px + 20, py + 12); ctx.fill(); }
      else if (tl === 5) { ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(px + (h % 18) + 4, py + ((h >> 4) % 18) + 4, 4, 3); }
      const poi = W.poiAt(s, x, y);
      if (poi) {
        ctx.font = (poi.settle ? 24 : 22) + 'px serif'; ctx.fillStyle = '#000'; ctx.fillText(D.POI_KINDS[poi.type].e, px + TS / 2, py + TS / 2 + 1);
        if (poi.settle) { ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.lineWidth = 3; const nm = poi.name.replace(/^(Aldea del Monte|Aldea|Ciudad|Capital) /, ''); ctx.strokeText(nm, px + TS / 2, py + TS - 2); ctx.fillText(nm, px + TS / 2, py + TS - 2); }
      }
      const dd = Math.abs(x - P.x) + Math.abs(y - P.y);
      if (dd > 6) { ctx.fillStyle = 'rgba(10,8,30,.35)'; ctx.fillRect(px, py, TS, TS); }
    }
    // jugador
    const px = (P.x - c.x) * TS, py = (P.y - c.y) * TS + Math.sin(t * 2) * 1.2, L = P.look;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(px + 16, py + 28, 9, 3.5, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = L.outfit; ctx.fillRect(px + 10, py + 15, 12, 12); ctx.fillStyle = L.outfit2; ctx.fillRect(px + 10, py + 20, 12, 3);
    ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(px + 16, py + 11, 7, 0, 6.3); ctx.fill();
    ctx.fillStyle = L.hairColor; ctx.beginPath(); ctx.arc(px + 16, py + 9, 7.4, Math.PI, 0); ctx.fill(); if (['long', 'bob', 'medium', 'twin'].includes(L.hairStyle)) { ctx.fillRect(px + 8, py + 9, 3, 10); ctx.fillRect(px + 21, py + 9, 3, 10); }
    ctx.fillStyle = '#1b1722'; ctx.fillRect(px + 13, py + 11, 2, 2); ctx.fillRect(px + 18, py + 11, 2, 2);
    // clima / hora
    const ph = s.time.phase; if (ph === 2) { ctx.fillStyle = 'rgba(14,14,60,.48)'; ctx.fillRect(0, 0, cv.width, cv.height); } else if (ph === 0) { ctx.fillStyle = 'rgba(255,190,120,.07)'; ctx.fillRect(0, 0, cv.width, cv.height); }
    if (Game.season() === 3) { ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let k = 0; k < 24; k++) { const sx = (k * 83 + t * 18) % cv.width, sy = (k * 47 + t * 26) % cv.height; ctx.fillRect(sx, sy, 2, 2); } }
    if (Game.season() === 0) { ctx.fillStyle = 'rgba(255,170,200,.9)'; for (let k = 0; k < 14; k++) { const sx = (k * 83 + t * 14) % cv.width, sy = (k * 61 + t * 20) % cv.height; ctx.fillRect(sx, sy, 3, 2); } }
    UI.drawMini();
  };
  UI.drawMini = function (big) {
    const s = G.S, cv = big || $('minimap'); if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return; const w = s.world.w, h = s.world.h, k = big ? 10 : 4;
    cv.width = w * k; cv.height = h * k; const pal = PAL[Game.season()];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!s.explored[i]) { ctx.fillStyle = '#0f0c20'; } else ctx.fillStyle = [pal.water, pal.sand, pal.grass, pal.forest, pal.mount, pal.road][s.world.tiles[i]]; ctx.fillRect(x * k, y * k, k, k); }
    s.world.pois.forEach((p) => { if (!s.explored[p.y * w + p.x] || (p.hidden && !p.revealed)) return; if (big) { ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(D.POI_KINDS[p.type].e, p.x * k + k / 2, p.y * k + k / 2); } else { ctx.fillStyle = p.settle ? '#ffd966' : '#ff6b8a'; ctx.fillRect(p.x * k - 1, p.y * k - 1, k + 2, k + 2); } });
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#e0525f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.player.x * k + k / 2, s.player.y * k + k / 2, big ? 5 : 3, 0, 6.3); ctx.fill(); ctx.stroke();
  };
  UI.mapClick = function (e) {
    if (UI.mode !== 'game' || G.UI.view !== 'explore') return;
    const cv = $('map'), r = cv.getBoundingClientRect(); const c = cam();
    const tx = c.x + Math.floor(((e.clientX - r.left) / r.width) * VW), ty = c.y + Math.floor(((e.clientY - r.top) / r.height) * VH);
    const P = G.S.player; if (tx === P.x && ty === P.y) { const poi = W.poiAt(G.S, tx, ty); if (poi) UI.viewPoi(poi); return; }
    const path = W.findPath(G.S, P, { x: tx, y: ty }, 40);
    if (!path) { UI.toast('No puedes llegar hasta ahí (o aún no está explorado).'); return; }
    UI.walkPath(path);
  };
  UI.walkPath = function (path) {
    UI.stopWalk(); let i = 0;
    UI.walk = setInterval(() => {
      if (UI.view !== 'explore' || i >= path.length) { UI.stopWalk(); return; }
      const P = G.S.player, n = path[i++]; if (!UI.move(n.x - P.x, n.y - P.y)) UI.stopWalk();
    }, 120);
  };
  UI.stopWalk = function () { if (UI.walk) { clearInterval(UI.walk); UI.walk = null; } };
  A.dir = (dx, dy) => { UI.stopWalk(); UI.move(parseInt(dx, 10), parseInt(dy, 10)); };

  UI.move = function (dx, dy) {
    if (UI.view !== 'explore' || !G.S) return false;
    const res = Game.step(dx, dy);
    if (res.blocked) { UI.toast(res.msg); return false; }
    G.Sfx.play('step'); UI.steps++; UI.hud(); UI.draw();
    if (res.logs && res.logs.length) UI.toasts(res.logs);
    if (UI.steps % 14 === 0) UI.autosave();
    if (res.poi) { UI.stopWalk(); UI.autosave(); UI.viewPoi(res.poi); return false; }
    if (res.enc) { UI.stopWalk(); UI.handleEncounter(res.enc); return false; }
    UI.updateTile(); return true;
  };

  /* ---------- modales ---------- */
  A.closemodal = () => UI.closeModal();
  UI.closeModal = function () { $('modal').classList.add('hidden'); $('modal').innerHTML = ''; UI.hud(); if (UI.view === 'explore') UI.viewExplore(); };
  const TABS = [['char', '🧑 Personaje'], ['inv', '🎒 Mochila'], ['quests', '📜 Misiones'], ['rel', '💞 Gente'], ['family', '🏠 Familia'], ['map', '🗺️ Mapa'], ['diary', '📖 Diario'], ['sys', '⚙️ Sistema']];
  UI.openModal = function (tab) {
    if (!G.S || UI.mode !== 'game') return; UI.stopWalk(); UI.tab = tab;
    const m = $('modal'); m.classList.remove('hidden');
    m.innerHTML = '<div class="modal-box"><div class="modal-tabs">' + TABS.map(([k, l]) => '<button class="tab ' + (k === tab ? 'on' : '') + '" data-act="tab" data-a="' + k + '">' + l + '</button>').join('') + '<button class="tab close" data-act="closemodal" aria-label="Cerrar">✕</button></div><div class="modal-body" id="modal-body"></div></div>';
    UI.renderTab(tab);
  };
  UI.refreshTab = () => { if (!$('modal').classList.contains('hidden')) UI.openModal(UI.tab); };
  UI.renderTab = function (tab) {
    const s = G.S, P = s.player, d = Game.derived(P), body = $('modal-body'); let h = '';
    if (tab === 'char') {
      const pw = D.POWERS[P.power], pe = { id: 'player', look: P.look };
      h = '<div class="char-grid"><div class="char-side">' + G.Port.html(pe, P.hp < d.maxHp * 0.3 ? 'nervioso' : 'alegre', { w: 170 }) + '<h3>' + esc(P.name) + '</h3><p class="muted">' + D.ORIGINS[P.origin].e + ' ' + D.ORIGINS[P.origin].n + ' · ' + Game.age(P) + ' años</p><p>' + pw.e + ' <b>' + pw.n + '</b> · rango ' + P.powerRank + '</p><p>⚖️ ' + D.honorTitle(P.honor) + ' (' + P.honor + ') · 📣 Fama ' + P.fame + '</p>'
        + (P.self.pers || P.self.story ? '<p class="quote">«' + esc((P.self.pers || P.self.story).slice(0, 160)) + '»</p>' : '') + '</div><div>'
        + '<h4>Atributos ' + (P.points ? '<span class="glow-t">· ' + P.points + ' puntos libres</span>' : '') + '</h4><div class="stats-alloc">' + Object.keys(D.STATS).map((k) => '<div class="srow"><span>' + D.STATS[k].e + ' ' + D.STATS[k].n + '<small>' + D.STATS[k].d + '</small></span><span class="sctl"><b>' + d.st[k] + (d.st[k] !== P.stats[k] ? '<small> (' + P.stats[k] + ')</small>' : '') + '</b>' + (P.points ? UI.btn('+', 'spend', k, null, { cls: 'mini' }) : '') + '</span></div>').join('') + '</div>'
        + '<h4>Combate</h4><p class="muted">Vida ' + d.maxHp + ' · Energía ' + d.maxEn + ' · Ataque ' + d.atk.toFixed(0) + ' · Poder ' + d.mag.toFixed(0) + ' · Defensa ' + d.def.toFixed(0) + ' · Crítico ' + d.crit.toFixed(0) + '% · Esquiva ' + d.dodge.toFixed(0) + '%</p>'
        + '<h4>Equipo</h4><div class="equip">' + ['arma', 'armadura', 'amuleto'].map((sl) => { const it = D.ITEMS[P.equip[sl]]; return '<button class="slot" data-act="unequip" data-a="' + sl + '"' + (it ? '' : ' disabled') + '><small>' + sl + '</small>' + (it ? it.e + ' ' + it.n : '—') + '</button>'; }).join('') + '</div>'
        + '<h4>Técnicas de ' + pw.n + '</h4>' + pw.skills.map((sk) => '<div class="skill ' + (sk.lvl > P.level ? 'lock' : '') + '"><b>' + (sk.lvl > P.level ? '🔒' : pw.e) + ' ' + sk.n + '</b><small>Nv. ' + sk.lvl + ' · ' + sk.cost + ' energía · ' + UI.skillDesc(sk) + '</small></div>').join('') + '</div></div>';
    } else if (tab === 'inv') {
      const groups = [['cons', 'Consumibles'], ['weapon', 'Armas'], ['armor', 'Armaduras'], ['amulet', 'Amuletos'], ['gift', 'Regalos'], ['mat', 'Materiales'], ['key', 'Especiales']];
      h = '<p class="muted">🪙 ' + P.gold + ' ryo</p>' + groups.map(([t, l]) => { const items = Object.keys(P.inv).filter((id) => D.ITEMS[id] && D.ITEMS[id].t === t); if (!items.length) return ''; return '<h4>' + l + '</h4>' + items.map((id) => { const it = D.ITEMS[id], eq = Object.values(P.equip).includes(id); return '<div class="item"><span>' + it.e + ' <b>' + it.n + '</b> ×' + P.inv[id] + (eq ? ' <em>(equipado)</em>' : '') + '<small>' + it.d + '</small></span><span>' + (it.t === 'cons' && (it.hp || it.en || it.cure) ? UI.btn('Usar', 'useitem', id, null, { cls: 'mini' }) : '') + (['weapon', 'armor', 'amulet'].includes(it.t) && !eq ? UI.btn('Equipar', 'equip', id, null, { cls: 'mini' }) : '') + '</span></div>'; }).join(''); }).join('') || '<p class="muted">Tu mochila está vacía.</p>';
    } else if (tab === 'quests') {
      const main = s.quests.filter((q) => q.kind === 'main'), side = s.quests.filter((q) => q.kind !== 'main');
      const row = (q) => '<div class="quest ' + q.status + '"><b>' + (q.status === 'done' ? '✅ ' : Game.questReady(q) ? '🟢 ' : '📌 ') + esc(q.title) + '</b><small>' + esc(q.desc) + (q.need > 1 || q.type === 'bring' ? ' · ' + (q.type === 'bring' ? Math.min(q.need, Game.count(q.target)) : q.have) + '/' + q.need : '') + (q.reward && (q.reward.gold || q.reward.xp) ? ' · Recompensa: ' + (q.reward.gold ? q.reward.gold + ' ryo ' : '') + (q.reward.xp ? q.reward.xp + ' XP' : '') : '') + '</small></div>';
      h = '<h4>Historia principal</h4>' + main.map(row).join('') + '<h4>Encargos</h4>' + (side.length ? side.map(row).join('') : '<p class="muted">No tienes encargos. Prueba en el gremio de una ciudad, o pide ayuda a alguien con quien tengas confianza.</p>') + '<p class="hint">Sellos: ' + s.main.seals + '/3</p>';
    } else if (tab === 'rel') {
      const met = Object.values(s.npcs).filter((n) => n.met && n.status !== 'dead').sort((a, b) => NPC.stageOf(b).h - NPC.stageOf(a).h || b.affinity - a.affinity);
      h = met.length ? '<div class="relgrid">' + met.map((n) => { const st = NPC.stageOf(n), poi = n.home && W.poi(s, n.home); return '<div class="relcard">' + G.Port.html(n, n.mood, { w: 64 }) + '<div><b>' + esc(n.name) + '</b> <small>' + esc(NPC.jobName(n)) + '</small><div class="hearts">' + '♥'.repeat(st.h) + '<span>' + '♡'.repeat(5 - st.h) + '</span></div><small>' + st.n + ' · afinidad ' + n.affinity + (NPC.canRomance(n, P) ? ' · romance ' + n.romance : '') + '</small><small>📍 ' + (poi ? esc(poi.name) : 'de viaje') + '</small></div></div>'; }).join('') + '</div>' : '<p class="muted">Todavía no conoces a nadie. ¡Habla con la gente de los pueblos!</p>';
    } else if (tab === 'family') {
      h = UI.familyHtml();
    } else if (tab === 'map') {
      h = '<canvas id="bigmap" class="bigmap"></canvas><p class="hint">🟡 Asentamientos · el círculo blanco eres tú. Haz clic en el mapa principal para caminar.</p>';
    } else if (tab === 'diary') {
      h = '<div class="diary">' + s.log.slice().reverse().slice(0, 80).map((l) => '<p class="' + l.c + '"><small>Día ' + l.d + ' ' + D.PHASES[l.ph].e + '</small> ' + esc(l.t) + '</p>').join('') + '</div>';
    } else if (tab === 'sys') {
      h = '<h4>Guardar partida</h4><div class="chips">' + [1, 2, 3].map((i) => UI.btn('💾 Ranura ' + i, 'saveslot', 'slot' + i)).join('') + '</div><p class="hint">Se guarda automáticamente cada pocos pasos en este navegador (IndexedDB).</p><h4>Copia de seguridad</h4><div class="chips">' + UI.btn('⬇️ Exportar partida (.json)', 'export') + UI.btn('⬆️ Importar', 'import') + '</div><h4>Ajustes</h4><div class="chips">' + UI.btn(G.Settings.data.sound ? '🔊 Sonido: sí' : '🔇 Sonido: no', 'sound') + '</div><h4>Controles</h4><p class="muted">Flechas o WASD para moverte · clic en el mapa para caminar · C personaje · I mochila · M misiones · R gente · F familia · N mapa · J diario</p><h4>Salir</h4>' + UI.btn('🏠 Volver al título', 'totitle', null, null, { cls: 'ghost' });
    }
    body.innerHTML = h;
    if (tab === 'map') UI.drawMini($('bigmap'));
  };
  UI.skillDesc = function (sk) {
    let t = sk.t === 'heal' ? 'Cura' : sk.t === 'buff' ? D.STATUS[sk.buff.id].n + ' ' + sk.buff.t + ' turnos' : sk.t === 'drain' ? 'Daño ×' + sk.m + ' y absorbe vida' : 'Daño ×' + sk.m + (sk.aoe ? ' a todos' : '');
    if (sk.st) t += ' · ' + Math.round(sk.st.p * 100) + '% ' + D.STATUS[sk.st.id].n.toLowerCase();
    return t;
  };
  A.spend = (k) => { if (Game.spendPoint(k)) { G.Sfx.play('level'); UI.hud(); UI.renderTab('char'); } };
  A.unequip = (sl) => { Game.unequip(sl); UI.renderTab('char'); };
  A.useitem = (id) => { const r = Game.useItem(id); if (r) UI.toast(r.msg); UI.hud(); UI.renderTab('inv'); };
  A.equip = (id) => { Game.equip(id); UI.renderTab('inv'); };
  A.saveslot = async (sl) => { await Game.save(sl); UI.toast('💾 Partida guardada.'); };
  A.export = () => { G.Storage.exportFile(Object.assign({}, G.S, { combat: null, savedAt: Date.now() })); };
  A.totitle = async () => { await Game.save('auto'); $('modal').classList.add('hidden'); UI.showTitle(); };
})((window.G = window.G || {}));
