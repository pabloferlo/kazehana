/* KAZEHANA · interfaz (vistas del panel): exploración, asentamientos, diálogo, combate, eventos, mazmorras, familia */
(function (G) {
  'use strict';
  const D = G.D, U = G.U, W = G.World, NPC = G.NPC, Game = G.Game, So = G.Social, C = G.Combat, UI = G.UI, esc = U.esc, A = UI.acts, $ = UI.$;
  const S = () => G.S;

  /* ================= EXPLORACIÓN ================= */
  UI.viewIntro = function () {
    const P = S().player, o = D.ORIGINS[P.origin];
    UI.view = 'intro';
    UI.panel('Tu historia comienza', '<p class="story">' + esc(o.intro) + '</p>' + (P.self.story ? '<p class="quote">«' + esc(P.self.story.slice(0, 300)) + '»</p>' : '')
      + '<p class="hint">Explora el mapa con las <b>flechas / WASD</b> o haciendo clic. Entra en los pueblos para conocer gente, comprar, entrenar y formar una familia. Habla con el maestro de tu pueblo para empezar la historia principal.</p>' + UI.btn('⛩️ Empezar', 'intro_go', null, null, { cls: 'primary big' }), 'story');
  };
  A.intro_go = () => { const s = S(), poi = W.poiAt(s, s.player.x, s.player.y); poi ? UI.viewPoi(poi) : UI.viewExplore(); };

  UI.viewExplore = function () {
    const s = S(), P = s.player; UI.view = 'explore'; UI.hud(); UI.draw();
    const t = W.tileAt(s, P.x, P.y), tier = Game.regionTier(P.x, P.y);
    const near = s.world.pois.filter((p) => s.explored[p.y * s.world.w + p.x] && !(p.hidden && !p.revealed) && W.dist(p, P) <= 14).sort((a, b) => W.dist(a, P) - W.dist(b, P)).slice(0, 5);
    const dirTxt = (p) => (p.y < P.y ? 'N' : p.y > P.y ? 'S' : '') + (p.x < P.x ? 'O' : p.x > P.x ? 'E' : '');
    const logs = s.log.slice(-4).reverse();
    UI.panel('Explorando', '<div class="tileinfo"><b>' + W.ZONE_NAMES[t] + '</b> · peligro ' + '☠️'.repeat(tier) + '<small>' + D.PHASES[s.time.phase].n + ' · ' + D.SEASONS[Game.season()] + '</small></div>'
      + (near.length ? '<h4>Cerca de ti</h4><ul class="near">' + near.map((p) => '<li>' + D.POI_KINDS[p.type].e + ' ' + esc(p.name) + ' <small>' + W.dist(p, P) + ' pasos al ' + dirTxt(p) + '</small></li>').join('') + '</ul>' : '<p class="muted">No hay lugares conocidos cerca. ¡Explora!</p>')
      + '<div class="chips">' + UI.btn('⛺ Acampar', 'camp') + UI.btn('⏳ Esperar', 'wait') + UI.btn('🧪 Mochila', 'tab', 'inv') + '</div>'
      + '<h4>Últimos sucesos</h4><div class="mini-log">' + logs.map((l) => '<p class="' + l.c + '">' + esc(l.t) + '</p>').join('') + '</div>', 'explore');
  };
  UI.updateTile = function () { if (UI.view === 'explore') UI.viewExplore(); };
  A.wait = () => { const o = Game.advance(D.STEPS_PHASE); UI.toasts(o); UI.hud(); UI.draw(); UI.viewExplore(); };
  A.camp = () => {
    const r = Game.rest('camp'); UI.hud(); UI.draw(); UI.autosave();
    if (r.ambush) { UI.panel('Acampada', '<p>' + r.msg + '</p><p class="bad">¡Algo te ha despertado en mitad de la noche!</p>', 'event'); setTimeout(() => UI.fight(Game.makeGroup(Game.zoneOf(S().player.x, S().player.y), Game.regionTier(S().player.x, S().player.y)), {}, () => UI.viewExplore()), 900); }
    else UI.panel('Acampada', '<p>' + r.msg + '</p>' + UI.btn('Continuar', 'explore', null, null, { cls: 'primary' }), 'event');
  };
  A.explore = () => UI.viewExplore();

  UI.handleEncounter = function (enc) {
    if (enc.type === 'combat') UI.fight(enc.group, {}, () => UI.viewExplore());
    else if (enc.type === 'event') UI.viewEvent(enc.ev, () => UI.viewExplore());
    else if (enc.type === 'traveler') { const n = Game.meetTraveler(); UI.panel('Un viajero', '<p>Te cruzas en el camino con ' + NPC.shortDesc(n) + '.</p>' + UI.btn('Acercarte', 'npc', n.id, 'explore', { cls: 'primary' }) + UI.btn('Ignorar', 'explore'), 'event'); }
    else if (enc.type === 'treasure') {
      const msgs = []; S().player.gold += enc.gold; msgs.push('🪙 +' + enc.gold + ' ryo'); if (enc.item) { Game.addItem(enc.item, 1); msgs.push(D.ITEMS[enc.item].e + ' ' + D.ITEMS[enc.item].n); }
      G.Sfx.play('coin'); UI.hud(); UI.panel('¡Hallazgo!', '<p>Entre unas rocas encuentras un pequeño botín olvidado.</p>' + UI.list(msgs) + UI.btn('Continuar', 'explore', null, null, { cls: 'primary' }), 'event');
    }
  };

  /* ================= LUGARES ================= */
  UI.viewPoi = function (poi) {
    UI.view = 'poi'; UI.hud(); UI.draw(); const s = S(), P = s.player;
    if (poi.settle) {
      const conf = D.SETTLE[poi.type], here = P.home === poi.id;
      UI.panel(conf.e + ' ' + esc(poi.name), '<p class="muted">' + conf.n + ' · ' + poi.npcs.length + ' habitantes' + (s.family.home === poi.id ? ' · 🏠 tu hogar' : '') + '</p>'
        + '<p>' + ({ aldea: 'Casas de madera, campos de arroz y humo de cocinas.', ciudad: 'Calles animadas, faroles de papel y puestos de todo tipo.', capital: 'Murallas altas, tejados dorados y gente de todas partes.', monte: 'Cabañas de piedra entre la niebla, con olor a pino y leña.' }[poi.type]) + '</p>'
        + UI.btn('🚪 Entrar', 'town', poi.id, null, { cls: 'primary big' }) + UI.btn('Seguir camino', 'explore'), 'town');
      return;
    }
    const cd = Game.dungeonCooldown(poi), k = poi.type;
    const txt = { santuario: 'Un santuario antiguo, impregnado de energía. Aquí se guarda uno de los Sellos Ancestrales.', guarida: 'Una fortaleza de piedra negra bajo un cielo sin estrellas. Aquí duerme el Señor de las Sombras.', cueva: 'La entrada de una cueva exhala aire frío.', ruinas: 'Columnas rotas y estatuas sin rostro.', torre: 'Una torre inclinada, con ventanas como ojos vacíos.', mina: 'Vagonetas oxidadas y túneles que se pierden en la oscuridad.', bosque: 'Miles de farolillos flotan entre los árboles. No parecen encendidos por manos humanas.' }[k];
    UI.panel(D.POI_KINDS[k].e + ' ' + esc(poi.name), '<p>' + txt + '</p><p class="muted">Nivel de peligro ' + '☠️'.repeat(poi.tier) + (poi.sealTaken ? ' · 🔰 sello recogido' : '') + '</p>'
      + (cd > 0 ? '<p class="hint">El lugar está tranquilo. Podrás volver en ' + cd + ' días.</p>' : UI.btn('⚔️ Adentrarte', 'dg_enter', poi.id, null, { cls: 'primary big' })) + UI.btn('Retirarte', 'explore'), 'dungeon');
  };

  A.town = (id) => UI.viewTown(W.poi(S(), id));
  UI.viewTown = function (poi) {
    UI.view = 'town'; UI.hud(); const s = S(), conf = D.SETTLE[poi.type];
    const places = conf.places.map((pl) => { const n = W.npcsAt(s, poi, pl).length; return '<button class="place" data-act="place" data-a="' + poi.id + '" data-b="' + pl + '"><span>' + D.PLACES[pl].e + '</span><b>' + D.PLACES[pl].n + '</b><small>' + n + ' ' + (n === 1 ? 'persona' : 'personas') + '</small></button>'; }).join('');
    const home = s.family.home === poi.id;
    UI.panel(conf.e + ' ' + esc(poi.name), '<p class="muted">' + D.PHASES[s.time.phase].e + ' ' + D.PHASES[s.time.phase].n + ' · Día ' + s.time.day + '</p><div class="places">' + places + '</div>'
      + '<div class="chips">' + UI.btn('🛏️ Posada (' + conf.inn + ' ryo)', 'inn', poi.id) + UI.btn('🚶 Pasear', 'stroll', poi.id)
      + (home ? UI.btn('🏠 Mi casa', 'home', poi.id, null, { cls: 'primary' }) : (!s.family.home ? UI.btn('🏷️ Comprar casa (' + conf.house + ' ryo)', 'buyhouse', poi.id) : '')) + UI.btn('🚪 Salir', 'explore', null, null, { cls: 'ghost' }) + '</div>', 'town');
  };
  A.inn = (id) => { const poi = W.poi(S(), id); const r = Game.rest('inn', poi); UI.hud(); UI.draw(); if (r.ok) UI.autosave(); UI.panel('Posada', '<p>' + r.msg + '</p>' + UI.btn('Continuar', 'town', id, null, { cls: 'primary' }), 'town'); };
  A.buyhouse = (id) => { const poi = W.poi(S(), id); const r = Game.buyHouse(poi); UI.hud(); UI.toast(r.msg); G.Sfx.play(r.ok ? 'level' : 'bad'); UI.viewTown(poi); };

  A.place = (id, pl) => UI.viewPlace(W.poi(S(), id), pl);
  function npcCard(n, back) {
    const st = NPC.stageOf(n), P = S().player;
    return '<button class="npccard" data-act="npc" data-a="' + n.id + '" data-b="' + back + '">' + G.Port.html(n, n.mood, { w: 56 }) + '<span><b>' + UI.pName(n) + '</b><small>' + (n.met ? esc(U.cap(NPC.jobName(n))) + ' · ' : '') + D.MOODS[n.mood].e + ' ' + D.MOODS[n.mood].l + '</small><i class="hearts">' + '♥'.repeat(st.h) + '</i>' + (NPC.canRomance(n, P) && NPC.attraction(n, P) >= 70 ? ' <i title="Te atrae">🔥</i>' : '') + '</span></button>';
  }
  UI.viewPlace = function (poi, pl) {
    UI.view = 'place'; UI.hud(); const s = S(), P = s.player; UI.cur = { poi: poi.id, place: pl };
    const people = W.npcsAt(s, poi, pl);
    let svc = '';
    if (pl === 'mercado') svc = UI.btn('🛒 Tienda', 'shop', poi.id, 'buy');
    if (pl === 'gremio') svc = UI.btn('📜 Tablón de encargos', 'board', poi.id);
    if (pl === 'dojo') svc = UI.btn('🥋 Entrenar', 'train', poi.id);
    if (pl === 'templo') svc = UI.btn('🙏 Rezar', 'pray', poi.id) + UI.btn('🔮 Maestro de poderes', 'rank', poi.id);
    if (pl === 'arena') svc = UI.btn('⚔️ Combates de arena', 'arena', poi.id);
    if (pl === 'taberna') svc = UI.btn('🍶 Pedir una bebida (8 ryo)', 'drink', poi.id) + UI.btn('👀 Buscar compañía', 'stroll', poi.id);
    if (pl === 'plaza') svc = UI.btn('🚶 Pasear por las calles', 'stroll', poi.id);
    UI.panel(D.PLACES[pl].e + ' ' + D.PLACES[pl].n + ' · ' + esc(poi.name), '<p class="muted">' + D.PLACES[pl].d + '</p><div class="chips">' + svc + '</div><h4>Gente aquí ahora</h4>' + (people.length ? '<div class="npclist">' + people.map((n) => npcCard(n, 'place')).join('') + '</div>' : '<p class="muted">No hay nadie a esta hora.</p>') + '<div class="chips">' + UI.btn('← Volver', 'town', poi.id, null, { cls: 'ghost' }) + '</div>', 'town');
  };
  A.pray = (id) => { const s = S(), P = s.player, poi = W.poi(s, id); const d = Game.derived(P); const f = s.flags.prayDay === s.time.day; Game.advance(2); if (!f) { s.flags.prayDay = s.time.day; Game.heal(Math.round(d.maxHp * 0.3), Math.round(d.maxEn * 0.5)); Game.addHonor(1); UI.toast('🙏 Sientes paz. Recuperas fuerzas.'); } else UI.toast('Hoy ya has rezado. La calma sigue contigo.'); UI.hud(); UI.viewPlace(poi, 'templo'); };
  A.drink = (id) => { const s = S(), P = s.player, poi = W.poi(s, id); if (P.gold < 8) { UI.toast('Necesitas 8 ryo.'); return; } P.gold -= 8; Game.advance(2); Game.heal(10, 5); const rumor = So.rumor({}); UI.hud(); UI.panel('🍶 Taberna', '<p>Pides una bebida. El tabernero se inclina y susurra:</p><p class="quote">«' + esc(rumor) + '»</p>' + UI.btn('← Volver', 'place', id, 'taberna', { cls: 'primary' }), 'town'); };
  A.stroll = (id) => {
    const s = S(), P = s.player, poi = W.poi(s, id), R = U.R; Game.advance(3); UI.hud();
    const r = R.r();
    if (r < 0.42 && poi.npcs.length < 26) {
      const pref = P.prefs.interest; const g = pref === 'none' || pref === 'both' || R.chance(0.4) ? R.pick(['m', 'f']) : pref;
      const n = NPC.gen(R, { settle: poi.type, home: poi.id, gender: g, level: poi.tier * 2 - 1, id: U.uid('l') }); n.special = 'local'; s.npcs[n.id] = n; poi.npcs.push(n.id);
      UI.panel('Un encuentro', '<p>Paseando por las calles de ' + esc(poi.name) + ', te cruzas con ' + NPC.shortDesc(n) + ' que te mira con curiosidad.</p>' + UI.btn('Acercarte', 'npc', n.id, 'town', { cls: 'primary' }) + UI.btn('Seguir paseando', 'town', id), 'event');
    } else if (r < 0.72) { const ev = Game.pickEvent(null, true); if (ev) UI.viewEvent(ev, () => UI.viewTown(poi)); else UI.viewTown(poi); }
    else UI.panel('Paseo', '<p>' + R.pick(['Los niños corren tras un gato. Alguien vende castañas asadas.', 'Un viejo teje redes en su puerta y te saluda con la cabeza.', 'Las linternas se mecen con el viento. Todo está en calma.', 'Oyes una música lejana de shamisen. Sigue la melodía hasta la plaza.']) + '</p>' + UI.btn('Continuar', 'town', id, null, { cls: 'primary' }), 'town');
  };

  /* ---------- tienda ---------- */
  A.shop = (id, tab) => {
    const s = S(), P = s.player, poi = W.poi(s, id); UI.view = 'shop'; UI.shopTab = tab || 'buy';
    let body = '<div class="chips">' + UI.btn('Comprar', 'shop', id, 'buy', { cls: UI.shopTab === 'buy' ? 'primary' : '' }) + UI.btn('Vender', 'shop', id, 'sell', { cls: UI.shopTab === 'sell' ? 'primary' : '' }) + '</div><p class="muted">🪙 ' + P.gold + ' ryo</p>';
    if (UI.shopTab === 'buy') body += (D.SHOP[poi.type] || D.SHOP.aldea).map((iid) => { const it = D.ITEMS[iid], pr = Game.buyPrice(iid); return '<div class="item"><span>' + it.e + ' <b>' + it.n + '</b> <small>' + it.d + '</small></span>' + UI.btn(pr + ' 🪙', 'buy', iid, id, { cls: 'mini', off: P.gold < pr }) + '</div>'; }).join('');
    else body += Object.keys(P.inv).filter((iid) => D.ITEMS[iid].t !== 'key').map((iid) => { const it = D.ITEMS[iid]; return '<div class="item"><span>' + it.e + ' <b>' + it.n + '</b> ×' + P.inv[iid] + '</span>' + UI.btn(Game.sellPrice(iid) + ' 🪙', 'sell', iid, id, { cls: 'mini' }) + '</div>'; }).join('') || '<p class="muted">No tienes nada que vender.</p>';
    UI.panel('🛒 Mercado', body + UI.btn('← Volver', 'place', id, 'mercado', { cls: 'ghost' }), 'town');
  };
  A.buy = (iid, id) => { const r = Game.buy(iid); G.Sfx.play(r.ok ? 'coin' : 'bad'); UI.toast(r.msg); UI.hud(); A.shop(id, 'buy'); };
  A.sell = (iid, id) => { const r = Game.sell(iid); G.Sfx.play(r.ok ? 'coin' : 'bad'); UI.toast(r.msg); UI.hud(); A.shop(id, 'sell'); };

  /* ---------- gremio, dojo, maestro de poderes, arena ---------- */
  A.board = (id) => {
    const s = S(), poi = W.poi(s, id), b = Game.board(poi); UI.view = 'shop';
    const ready = s.quests.filter((q) => q.giver === 'gremio' && Game.questReady(q) && q.status !== 'done');
    UI.panel('📜 Tablón del gremio', (ready.length ? '<h4>Listas para entregar</h4>' + ready.map((q) => '<div class="quest ready"><b>🟢 ' + esc(q.title) + '</b><small>' + esc(q.desc) + '</small>' + UI.btn('Cobrar (' + (q.reward.gold || 0) + ' 🪙)', 'turnin', q.id, id, { cls: 'mini primary' }) + '</div>').join('') : '')
      + '<h4>Encargos disponibles</h4>' + (b.quests.length ? b.quests.map((q) => '<div class="quest"><b>' + esc(q.title) + '</b><small>' + esc(q.desc) + ' · ' + q.reward.gold + ' ryo, ' + q.reward.xp + ' XP</small>' + UI.btn('Aceptar', 'accept', q.id, id, { cls: 'mini' }) + '</div>').join('') : '<p class="muted">No quedan encargos. Vuelve en unos días.</p>') + UI.btn('← Volver', 'place', id, 'gremio', { cls: 'ghost' }), 'town');
  };
  A.accept = (qid, id) => { if (Game.acceptQuest(id, qid)) UI.toast('📜 Misión aceptada.'); else UI.toast('Ya tienes demasiados encargos.'); A.board(id); };
  A.turnin = (qid, id) => { const q = S().quests.find((x) => x.id === qid); const out = Game.turnIn(q); if (out) { G.Sfx.play('win'); UI.toasts(out); } UI.hud(); A.board(id); };

  A.train = (id) => {
    const P = S().player; UI.view = 'shop'; const rows = Object.keys(D.STATS).map((k) => { const c = Game.trainCost(P, k); return '<div class="item"><span>' + D.STATS[k].e + ' <b>' + D.STATS[k].n + '</b> ' + P.stats[k] + '<small>' + D.STATS[k].d + ' · una jornada de entrenamiento</small></span>' + UI.btn(c + ' 🪙', 'dotrain', k, id, { cls: 'mini', off: P.gold < c }) + '</div>'; }).join('');
    UI.panel('🥋 Dojo', '<p class="muted">Entrenar cuesta una jornada de tiempo y dinero; no siempre hay progreso. 🪙 ' + P.gold + '</p>' + rows + UI.btn('← Volver', 'place', id, 'dojo', { cls: 'ghost' }), 'town');
  };
  A.dotrain = (k, id) => { const r = Game.train(k, 0); UI.toast(r.msg); if (r.xp) UI.toasts(r.xp); G.Sfx.play(r.ok ? 'level' : 'bad'); UI.hud(); A.train(id); };
  A.rank = (id) => {
    const P = S().player, pw = D.POWERS[P.power]; UI.view = 'shop';
    UI.panel('🔮 Maestro de poderes', '<p>Tu poder: ' + pw.e + ' <b>' + pw.n + '</b>, rango <b>' + P.powerRank + '/5</b>. Cada rango aumenta un 8% el daño de tus técnicas.</p>' + (P.powerRank < 5 ? '<p class="muted">Siguiente rango: ' + Game.rankCost(P) + ' ryo · nivel ' + 3 * (P.powerRank + 1) + '</p>' + UI.btn('Ascender de rango', 'dorank', id, null, { cls: 'primary', off: P.gold < Game.rankCost(P) || P.level < 3 * (P.powerRank + 1) }) : '<p class="ok">Has alcanzado el máximo.</p>') + UI.btn('← Volver', 'place', id, 'templo', { cls: 'ghost' }), 'town');
  };
  A.dorank = (id) => { const r = Game.rankUp(); UI.toast(r.msg); G.Sfx.play(r.ok ? 'level' : 'bad'); UI.hud(); A.rank(id); };
  A.arena = (id) => {
    const P = S().player; UI.view = 'shop'; const tiers = [['Novato', ['bandido', 'bandido'], 0, 40, 20], ['Veterano', ['ronin', 'ninja'], 1, 120, 50], ['Campeón', ['jinete', 'asesino'], 3, 300, 100]];
    UI.panel('🏟️ Arena', '<p class="muted">Entrada: 20 ryo. El público ruge.</p>' + tiers.map((t, i) => '<div class="item"><span><b>' + t[0] + '</b><small>Premio ' + t[3] + ' ryo + XP · rivales de nivel ' + (P.level + t[2]) + '</small></span>' + UI.btn('Luchar', 'dofight_arena', i, id, { cls: 'mini', off: P.gold < 20 }) + '</div>').join('') + UI.btn('← Volver', 'place', id, 'arena', { cls: 'ghost' }), 'town');
  };
  A.dofight_arena = (i, id) => {
    const P = S().player, tiers = [[['bandido', 'bandido'], 0, 40], [['ronin', 'ninja'], 1, 120], [['jinete', 'asesino'], 3, 300]], t = tiers[+i];
    P.gold -= 20; Game.advance(3); UI.hud();
    UI.fight(t[0].map((e) => ({ id: e, lvl: Math.max(1, P.level + t[1]) })), { noFlee: true, arena: true }, (res) => { if (res === 'win') { P.gold += t[2]; P.fame += 2; UI.toast('🏆 ¡Ganas el combate! +' + t[2] + ' ryo, fama +2'); G.Sfx.play('win'); } UI.hud(); A.arena(id); });
  };

  /* ================= DIÁLOGO ================= */
  A.npc = (id, back) => {
    const cur = UI.cur; let bk;
    if (back === 'place' && cur) bk = () => UI.viewPlace(W.poi(S(), cur.poi), cur.place);
    else if (back === 'town') { const poi = W.poi(S(), S().npcs[id].home) || W.poi(S(), cur && cur.poi); bk = () => UI.viewTown(poi); }
    else if (back === 'home') bk = () => UI.viewHome(W.poi(S(), S().family.home));
    else bk = () => UI.viewExplore();
    UI.viewNpc(id, bk);
  };
  UI.viewNpc = function (id, back) {
    const n = S().npcs[id]; UI.view = 'dialogue';
    UI.dlg = { id, lines: So.open(n), sub: null, back: back || (() => UI.viewExplore()) };
    UI.renderNpc();
  };
  function lineHtml(l, n) {
    if (l.who === 'sys') return '<div class="msg sys">' + esc(l.text) + '</div>';
    if (l.who === 'me') return '<div class="msg me"><p>«' + esc(l.text) + '»</p></div>';
    return '<div class="msg npc"><i>' + esc(l.emote || '') + '</i><p>«' + esc(l.text) + '»</p></div>';
  }
  UI.renderNpc = function () {
    const s = S(), P = s.player, dl = UI.dlg, n = s.npcs[dl.id], st = NPC.stageOf(n), rom = NPC.canRomance(n, P), attr = NPC.attraction(n, P);
    const mood = D.MOODS[n.mood];
    const info = [];
    info.push('<li><b>Trabajo</b> ' + (n.met ? esc(NPC.jobName(n)) : '¿?') + '</li>');
    info.push('<li><b>Edad</b> ' + (n.met ? n.age + ' años' : 'aprox. ' + ({ joven: '20-29', adulto: '30-44', mediana: '45-59', mayor: '60+' }[NPC.ageGroup(n.age)])) + '</li>');
    if (n.met && n.affinity >= 10) info.push('<li><b>Carácter</b> ' + D.PERS[n.pers].n + ' · <small>' + D.PERS[n.pers].d + '</small></li>');
    if (n.met && n.affinity >= 10 && n.power) info.push('<li><b>Poder</b> ' + D.POWERS[n.power].e + ' ' + D.POWERS[n.power].n + '</li>');
    if (n.met && n.affinity >= 40) info.push('<li><b>Le gusta</b> ' + n.likes.join(', ') + '</li><li><b>No le gusta</b> ' + n.dislikes.join(', ') + '</li>');
    if (rom && n.met && n.affinity >= 25) info.push('<li><b>Romance</b> <span class="meter"><i style="width:' + n.romance + '%"></i></span> ' + n.romance + '/100</li>');
    const left = '<div class="npc-left"><div class="portrait-wrap mood-' + n.mood + '">' + G.Port.html(n, n.mood, { w: 190 }) + '<span class="moodchip">' + mood.e + ' ' + mood.l + '</span></div>'
      + '<h3>' + UI.pName(n) + '</h3><div class="hearts big">' + '♥'.repeat(st.h) + '<span>' + '♡'.repeat(5 - st.h) + '</span> <small>' + st.n + '</small></div>'
      + (rom && attr ? '<p class="attr">' + NPC.attrLabel(attr).replace('atractiv@', 'atractiv' + (n.gender === 'm' ? 'o' : 'a')) + '</p>' : '')
      + '<details ' + (!n.met || n.affinity < 15 ? 'open' : '') + '><summary>Cómo es</summary><p class="desc">' + esc(NPC.describe(n)) + '</p></details><ul class="info">' + info.join('') + '</ul></div>';
    let act = '';
    if (!n.met) act = UI.btn('👋 Presentarte', 'dlg_intro', null, null, { cls: 'primary big' }) + UI.btn('Alejarte', 'dlg_leave', null, null, { cls: 'ghost' });
    else act = UI.dlgActions(n);
    UI.panel('Conversación', '<div class="npc-view">' + left + '<div class="npc-right"><div class="chatlog" id="chatlog">' + dl.lines.slice(-12).map((l) => lineHtml(l, n)).join('') + '</div><div class="actions">' + act + '</div></div></div>', 'dialogue');
    const cl = $('chatlog'); if (cl) cl.scrollTop = cl.scrollHeight;
  };
  UI.dlgActions = function (n) {
    const dl = UI.dlg, P = S().player, rom = NPC.canRomance(n, P) || (NPC.genderMatch(P, n) && P.prefs.interest !== 'none');
    const b = (label, id, sub, extra) => { const why = So.why(n, id); return UI.btn(label, sub ? 'dlg_sub' : 'dlg_do', sub || id, sub ? null : extra, { off: !!why && id !== 'regalar', title: why || '', cls: why ? 'dim' : '' }); };
    if (dl.sub === 'topics') {
      const T = [['general', '💬 Charla general', 0], ['trabajo', '🛠️ Su trabajo', 0], ['rumores', '👂 Rumores', 0], ['poder', '🔮 Poderes', 10], ['suenos', '🌟 Sueños', 15], ['miedos', '😨 Miedos', 35], ['secretos', '🤫 Secretos', 60]];
      return '<h5>¿De qué hablar?</h5><div class="chips">' + T.map(([k, l, need]) => UI.btn((n.affinity < need ? '🔒 ' : '') + l, 'dlg_do', 'charlar', k, { off: n.affinity < need, title: n.affinity < need ? 'Afinidad ' + need : '' })).join('') + '</div>' + UI.btn('← Atrás', 'dlg_sub', '', null, { cls: 'ghost' });
    }
    if (dl.sub === 'compl') return '<h5>Cumplido sobre…</h5><div class="chips">' + UI.btn('💄 Su aspecto', 'dlg_do', 'cumplido', 'aspecto') + UI.btn('💛 Su personalidad', 'dlg_do', 'cumplido', 'personalidad') + UI.btn('⚡ Su fuerza / poder', 'dlg_do', 'cumplido', 'poder') + '</div>' + UI.btn('← Atrás', 'dlg_sub', '', null, { cls: 'ghost' });
    if (dl.sub === 'gifts') {
      const gifts = Object.keys(P.inv).filter((id) => D.ITEMS[id].t === 'gift');
      return '<h5>Elige un regalo</h5><div class="chips">' + (gifts.length ? gifts.map((id) => UI.btn(D.ITEMS[id].e + ' ' + D.ITEMS[id].n + ' ×' + P.inv[id], 'dlg_do', 'regalar', id)).join('') : '<span class="muted">No tienes regalos. Los hay en el mercado (flores, dulces, libros…).</span>') + '</div>' + UI.btn('← Atrás', 'dlg_sub', '', null, { cls: 'ghost' });
    }
    if (dl.sub === 'dates') return '<h5>¿Qué plan proponer?</h5><div class="chips">' + Object.keys(D.DATES).map((k) => { const d = D.DATES[k]; return UI.btn(d.e + ' ' + d.n + (d.cost ? ' (' + d.cost + ')' : ''), 'dlg_do', 'cita', k, { title: d.d }); }).join('') + '</div>' + UI.btn('← Atrás', 'dlg_sub', '', null, { cls: 'ghost' });
    const ready = So.hasReadyQuest(n);
    let h = '<h5>Conversar</h5><div class="chips">' + b('💬 Charlar', 'charlar', 'topics') + b('😄 Bromear', 'bromear') + b('🌹 Cumplido', 'cumplido', 'compl') + b('🎁 Regalar', 'regalar', 'gifts') + '</div>';
    if (rom) h += '<h5>Romance</h5><div class="chips">' + b('😘 Coquetear', 'coquetear') + b('🌸 Proponer cita', 'cita', 'dates') + (n.status !== 'dating' && n.status !== 'married' ? b('💌 Confesar sentimientos', 'confesar') : '') + (n.status === 'dating' || n.status === 'married' ? b('🌙 Pasar la noche juntos', 'noche') : '') + (n.status === 'dating' ? b('💍 Pedir matrimonio', 'proponer') + b('💔 Terminar', 'terminar') : '') + '</div>';
    h += '<h5>Otros</h5><div class="chips">' + b('🤝 Pedir ayuda', 'ayuda') + (ready ? UI.btn('📜 Entregar encargo', 'dlg_do', 'entregar', null, { cls: 'primary' }) : '') + b('🥋 Entrenar juntos', 'entrenar') + b('⚔️ Retar a duelo', 'retar') + UI.btn('👋 Despedirte', 'dlg_leave', null, null, { cls: 'ghost' }) + '</div>';
    return h;
  };
  A.dlg_sub = (k) => { UI.dlg.sub = k || null; UI.renderNpc(); };
  A.dlg_leave = () => { UI.hud(); UI.autosave(); UI.dlg.back(); };
  A.dlg_intro = () => { const n = S().npcs[UI.dlg.id]; const r = So.introduce(n); UI.dlg.lines = UI.dlg.lines.concat(r.lines); G.Sfx.play('love'); if (r.eff.length) UI.dlg.lines.push({ who: 'sys', text: r.eff.join(' · ') }); UI.hud(); UI.renderNpc(); };
  A.dlg_do = (action, arg) => {
    const n = S().npcs[UI.dlg.id], dl = UI.dlg; dl.sub = null;
    const r = So.interact(n.id, action, arg || undefined);
    dl.lines = dl.lines.concat(r.lines); if (r.eff.length) dl.lines.push({ who: 'sys', text: r.eff.join(' · ') });
    UI.hud(); if (r.fade) { document.body.classList.add('fade'); setTimeout(() => document.body.classList.remove('fade'), 1400); }
    if (r.fight) {
      UI.fight(r.fight, { duel: n.id }, (res) => { const dr = So.duelResult(n, res === 'win'); dl.lines = dl.lines.concat(dr.lines); if (dr.eff.length) dl.lines.push({ who: 'sys', text: dr.eff.join(' · ') }); UI.hud(); UI.view = 'dialogue'; UI.renderNpc(); });
      return;
    }
    UI.autosave(); UI.renderNpc();
  };

  /* ================= EVENTOS ================= */
  UI.viewEvent = function (ev, done) {
    UI.view = 'event'; UI.ev = { ev, done: done || (() => UI.viewExplore()) };
    UI.panel('🎴 ' + ev.title, '<p class="story">' + esc(ev.text) + '</p><div class="choices">' + ev.choices.map((c, i) => { const ok = Game.meets(c.req); return UI.btn(esc(c.t) + Game.reqText(c.req), 'ev_choice', i, null, { off: !ok, cls: ok ? '' : 'dim' }); }).join('') + '</div>', 'event');
  };
  A.ev_choice = (i) => {
    const e = UI.ev, c = e.ev.choices[+i]; if (!Game.meets(c.req)) return;
    const res = Game.applyOutcome(c.o); UI.hud(); UI.draw();
    if (res.msgs.some((m) => m.includes('🎉'))) G.Sfx.play('level');
    UI.panel('🎴 ' + e.ev.title, '<p class="story">' + esc(res.text) + '</p>' + UI.list(res.msgs) + '<div class="chips" id="evnext"></div>', 'event');
    const nx = $('evnext');
    if (res.fight) { nx.innerHTML = UI.btn('⚔️ ¡A luchar!', 'ev_fight', null, null, { cls: 'primary' }); UI.evFight = res.fight; }
    else if (res.npc) { nx.innerHTML = UI.btn('Continuar', 'ev_npc', null, null, { cls: 'primary' }); }
    else nx.innerHTML = UI.btn('Continuar', 'ev_done', null, null, { cls: 'primary' });
  };
  A.ev_done = () => { UI.autosave(); UI.ev.done(); };
  A.ev_fight = () => { const P = S().player, ids = UI.evFight; const done = UI.ev.done; UI.fight(Game.makeGroup(Game.zoneOf(P.x, P.y), 1, ids), {}, () => done()); };
  A.ev_npc = () => {
    const s = S(), P = s.player, done = UI.ev.done; let n;
    const poi = W.poiAt(s, P.x, P.y);
    if (poi && poi.settle) { const R = U.R; const g = P.prefs.interest === 'none' || P.prefs.interest === 'both' ? R.pick(['m', 'f']) : P.prefs.interest; n = NPC.gen(R, { settle: poi.type, home: poi.id, gender: g, id: U.uid('l') }); n.special = 'local'; s.npcs[n.id] = n; poi.npcs.push(n.id); }
    else n = Game.meetTraveler();
    UI.viewNpc(n.id, done);
  };

  /* ================= COMBATE ================= */
  UI.fight = function (group, opts, onEnd) { UI.fightEnd = onEnd; UI.csub = null; UI.stopWalk(); C.begin(group, opts || {}); UI.view = 'combat'; UI.viewCombat(); };
  UI.viewCombat = function () {
    const s = S(), c = s.combat, P = s.player, d = Game.derived(P); UI.view = 'combat'; UI.hud();
    const fxOf = (k, uid) => c.fx.filter((f) => f.k === k && (!uid || f.uid === uid)).map((f) => '<span class="float ' + (f.v < 0 ? 'heal' : f.crit ? 'crit' : '') + '">' + (f.v < 0 ? '+' + -f.v : '-' + f.v) + '</span>').join('');
    const stH = (st) => Object.keys(st).map((k) => '<i title="' + D.STATUS[k].n + '">' + D.STATUS[k].e + '</i>').join('');
    const enemies = c.enemies.map((e, i) => '<button class="enemy ' + (e.hp <= 0 ? 'dead' : '') + (c.target === i && e.hp > 0 ? ' target' : '') + (e.boss ? ' boss' : '') + '" data-act="cb_target" data-a="' + i + '"><div class="emoji">' + e.e + '</div><b>' + esc(e.n) + '</b><small>Nv. ' + e.lvl + '</small>' + UI.bar(e.hp, e.maxHp, 'hp') + '<div class="sts">' + stH(e.st) + '</div>' + fxOf('e', e.uid) + '</button>').join('');
    let menu = '';
    if (c.done) menu = '';
    else if (UI.csub === 'skills') menu = '<div class="chips">' + Game.skills(P).map((sk) => UI.btn(D.POWERS[P.power].e + ' ' + sk.n + ' <small>' + sk.cost + '</small>', 'cb', 'skill', sk.id, { off: P.en < sk.cost, title: UI.skillDesc(sk) })).join('') + '</div>' + UI.btn('← Atrás', 'cb_sub', '', null, { cls: 'ghost' });
    else if (UI.csub === 'items') { const its = Object.keys(P.inv).filter((id) => D.ITEMS[id].t === 'cons'); menu = '<div class="chips">' + (its.length ? its.map((id) => UI.btn(D.ITEMS[id].e + ' ' + D.ITEMS[id].n + ' ×' + P.inv[id], 'cb', 'item', id, { title: D.ITEMS[id].d })).join('') : '<span class="muted">Sin objetos.</span>') + '</div>' + UI.btn('← Atrás', 'cb_sub', '', null, { cls: 'ghost' }); }
    else menu = '<div class="chips big">' + UI.btn('🗡️ Atacar', 'cb', 'attack', null, { cls: 'primary' }) + UI.btn('✨ Técnicas', 'cb_sub', 'skills') + UI.btn('🛡️ Defender', 'cb', 'defend') + UI.btn('🎒 Objetos', 'cb_sub', 'items') + UI.btn('🏃 Huir', 'cb', 'flee', null, { off: !!c.opts.noFlee }) + '</div>';
    UI.panel('⚔️ Combate · turno ' + c.turn, '<div class="enemies">' + enemies + '</div><div class="pcard"><b>' + esc(P.name) + '</b> ' + stH(c.pst) + '<div class="bars2">' + UI.bar(P.hp, d.maxHp, 'hp') + UI.bar(P.en, d.maxEn, 'en') + '</div>' + fxOf('p') + '</div><div class="clog">' + c.log.slice(-7).map((l) => '<p class="' + l.c + '">' + esc(l.t) + '</p>').join('') + '</div>' + menu, 'combat');
    const cl = document.querySelector('.clog'); if (cl) cl.scrollTop = cl.scrollHeight;
    if (c.done) UI.endCombat();
  };
  A.cb_target = (i) => { C.setTarget(+i); UI.viewCombat(); };
  A.cb_sub = (k) => { UI.csub = k || null; UI.viewCombat(); };
  A.cb = (kind, arg) => { UI.csub = null; C.playerAct(kind, arg || undefined); UI.viewCombat(); };

  UI.endCombat = function () {
    const s = S(), c = s.combat, P = s.player, panel = $('panel');
    const wrap = (title, body, btn) => { const d = document.createElement('div'); d.className = 'cend'; d.innerHTML = '<h3>' + title + '</h3>' + body + btn; panel.querySelector('.panel-body').appendChild(d); };
    const finish = (res) => { s.combat = null; const f = UI.fightEnd; UI.fightEnd = null; UI.hud(); UI.draw(); UI.autosave(); if (f) f(res); else UI.viewExplore(); };
    A.cb_finish = () => finish(UI.lastRes);
    if (c.done === 'flee') { UI.lastRes = 'flee'; wrap('🏃 Has escapado', '', UI.btn('Continuar', 'cb_finish', null, null, { cls: 'primary' })); return; }
    if (c.done === 'win') {
      UI.lastRes = 'win'; G.Sfx.play('win');
      const allHuman = c.enemies.every((e) => e.human) && !c.opts.duel && !c.opts.arena && !c.enemies.some((e) => e.boss);
      const reward = (mode) => {
        const out = Game.victory(c);
        if (mode === 'spare') { Game.addHonor(4); out.push('🕊️ Honor +4 (perdonas la vida)'); if (U.R.chance(0.35)) { const p = Game.revealRandomPoi(); if (p) out.push('🗺️ Te susurran un secreto: ' + p.name); } }
        if (mode === 'kill') { Game.addHonor(-4); const g = Math.round(c.enemies.reduce((a, e) => a + e.gold, 0) * 0.3); S().player.gold += g; out.push('🩸 Honor -4 · botín extra +' + g + ' ryo'); }
        c.enemies.forEach((e) => { if (e.boss) out.push(...Game.onBoss(e.id)); });
        if (out.some((t) => t.includes('🎉'))) G.Sfx.play('level');
        UI.hud(); return out;
      };
      if (allHuman) {
        wrap('🏆 ¡Victoria!', '<p>Tus rivales están en el suelo, a tu merced…</p>', UI.btn('🕊️ Perdonarles', 'cb_mercy', 'spare', null) + UI.btn('🗡️ Acabar con ellos', 'cb_mercy', 'kill', null, { cls: 'danger' }));
        A.cb_mercy = (m) => { const out = reward(m); UI.panel('🏆 Victoria', UI.list(out) + UI.btn('Continuar', 'cb_finish', null, null, { cls: 'primary' }), 'combat'); };
      } else {
        const out = reward(null); wrap('🏆 ¡Victoria!', UI.list(out), UI.btn('Continuar', 'cb_finish', null, null, { cls: 'primary' }));
        if (s.main.done && c.enemies.some((e) => e.id === 'sombras')) { A.cb_finish = () => { s.combat = null; UI.fightEnd = null; s.dungeon = null; UI.viewEnding(); }; }
      }
      return;
    }
    if (c.done === 'lose') {
      G.Sfx.play('lose');
      if (c.opts.duel || c.opts.arena) { const d = Game.derived(P); P.hp = Math.max(1, Math.round(d.maxHp * 0.3)); UI.lastRes = 'lose'; wrap('💫 Has perdido el combate', '<p>Te levantas con orgullo herido pero sin daños graves.</p>', UI.btn('Continuar', 'cb_finish', null, null, { cls: 'primary' })); return; }
      const r = Game.defeat(); s.combat = null; UI.fightEnd = null; UI.hud(); UI.draw();
      if (r.over) { UI.gameOver(r.heirs); return; }
      UI.autosave();
      UI.panel('💀 Derrotado', '<p>' + esc(r.msg) + '</p>' + UI.btn('Continuar', 'poi_go', r.poi.id, null, { cls: 'primary' }), 'combat');
    }
  };
  A.poi_go = (id) => UI.viewPoi(W.poi(S(), id));

  UI.gameOver = function (heirs) {
    UI.view = 'over'; const P = S().player;
    UI.panel('💀 Has caído', '<p class="story">' + esc(P.name) + ' ha encontrado su final tras ' + S().time.day + ' días de aventura.</p>' + (heirs.length ? '<h4>Tu legado</h4><p class="muted">Uno de tus hijos puede continuar tu historia.</p>' + heirs.map((c) => '<div class="relcard">' + G.Port.html({ id: c.id, look: c.look }, 'alegre', { w: 64 }) + '<div><b>' + esc(c.name) + '</b> <small>' + Game.childAge(c) + ' años</small>' + UI.btn('Continuar como ' + esc(c.name), 'heir', c.id, null, { cls: 'primary mini' }) + '</div></div>').join('') : '<p class="muted">No tienes herederos. Tu historia termina aquí.</p>') + UI.btn('Volver al título', 'totitle', null, null, { cls: 'ghost' }), 'combat');
  };
  A.heir = (id) => { if (Game.continueAsHeir(id)) { G.Sfx.play('level'); UI.autosave(); UI.enterGame(); UI.toast('Una nueva generación comienza.'); } };

  UI.viewEnding = function () {
    const s = S(), P = s.player; UI.view = 'ending'; G.Sfx.play('level'); Game.save('auto');
    UI.panel('🌅 Epílogo', '<p class="story">El Señor de las Sombras se desvanece entre rayos de luz. Kazehana respira de nuevo, y por primera vez en siglos, el viento trae aroma a flores.</p><p>' + esc(P.name) + ', <b>' + D.honorTitle(P.honor) + '</b>, nivel ' + P.level + ' · ' + s.time.day + ' días · ' + P.kills + ' enemigos derrotados' + (P.spouse ? ' · casad' + (P.gender === 'm' ? 'o' : 'a') + ' con ' + esc(s.npcs[P.spouse].name) : '') + ' · ' + s.family.children.length + ' hijos.</p><p class="hint">Puedes seguir viviendo en este mundo: criar a tu familia, explorar, romancear y mejorar.</p>' + UI.btn('Seguir jugando', 'explore', null, null, { cls: 'primary' }) + UI.btn('Título', 'totitle', null, null, { cls: 'ghost' }), 'story');
  };

  /* ================= MAZMORRAS ================= */
  A.dg_enter = (id) => { const poi = W.poi(S(), id); Game.enterDungeon(poi); UI.viewDungeon(); };
  UI.viewDungeon = function () {
    const s = S(), dg = s.dungeon; if (!dg) { UI.viewExplore(); return; } const poi = W.poi(s, dg.poi); UI.view = 'dungeon'; UI.hud();
    const last = dg.room >= dg.rooms - 1;
    UI.panel(D.POI_KINDS[poi.type].e + ' ' + esc(poi.name), '<div class="dgbar">' + Array.from({ length: dg.rooms }, (_, i) => '<i class="' + (i < dg.room ? 'done' : i === dg.room ? 'cur' : '') + (i === dg.rooms - 1 ? ' boss' : '') + '"></i>').join('') + '</div><p class="story">' + (last ? 'Una presencia inmensa te espera tras la última puerta. Respira hondo.' : 'Sala ' + (dg.room + 1) + ' de ' + dg.rooms + '. La oscuridad te rodea; algo se mueve más allá.') + '</p>'
      + '<div class="chips">' + UI.btn(last ? '👁️ Enfrentarte al guardián' : '➡️ Avanzar', 'dg_next', null, null, { cls: 'primary big' }) + UI.btn('🎒 Mochila', 'tab', 'inv') + UI.btn('🚪 Retirarte', 'dg_leave', null, null, { cls: 'ghost' }) + '</div>', 'dungeon');
  };
  A.dg_leave = () => { const poi = W.poi(S(), S().dungeon.poi); S().dungeon = null; UI.viewPoi(poi); };
  UI.dgAfter = function (res) { const s = S(); if (!s.dungeon) return; if (res === 'win' || res === 'ok') s.dungeon.room++; UI.autosave(); UI.viewDungeon(); };
  A.dg_next = () => {
    const s = S(), P = s.player, poi = W.poi(s, s.dungeon.poi), room = Game.dungeonRoom(); UI.view = 'dungeon';
    if (room.type === 'combat') UI.fight(room.group, {}, (r) => UI.dgAfter(r));
    else if (room.type === 'boss') {
      UI.fight([{ id: room.enemy, lvl: Math.max(1, P.level + (poi.type === 'guarida' ? 2 : 1)) }], { noFlee: true }, (r) => {
        if (r === 'win') { if (s.main.done) return; const out = Game.dungeonFinish(); UI.hud(); UI.panel('🏆 ' + esc(poi.name) + ' completado', UI.list(out) + UI.btn('Continuar', 'poi_go', poi.id, null, { cls: 'primary' }), 'dungeon'); G.Sfx.play('win'); UI.autosave(); }
        else UI.viewDungeon();
      });
    } else if (room.type === 'event') UI.viewEvent(room.ev, () => UI.dgAfter('ok'));
    else if (room.type === 'treasure') { P.gold += room.gold; Game.addItem(room.item, 1); G.Sfx.play('coin'); UI.hud(); UI.panel('💰 Tesoro', '<p>Un cofre cubierto de polvo.</p>' + UI.list(['🪙 +' + room.gold + ' ryo', D.ITEMS[room.item].e + ' ' + D.ITEMS[room.item].n]) + UI.btn('Continuar', 'dg_ok', null, null, { cls: 'primary' }), 'dungeon'); }
    else if (room.type === 'rest') { const d = Game.derived(P); Game.heal(Math.round(d.maxHp * 0.3), Math.round(d.maxEn * 0.3)); G.Sfx.play('heal'); UI.hud(); UI.panel('🕯️ Sala tranquila', '<p>Encuentras un rincón seguro con una vela encendida. Recuperas un poco el aliento.</p>' + UI.list(['❤️ +30% vida', '🔷 +30% energía']) + UI.btn('Continuar', 'dg_ok', null, null, { cls: 'primary' }), 'dungeon'); }
    else { P.hp = Math.max(1, P.hp - room.dmg); G.Sfx.play('hurt'); UI.hud(); UI.panel('⚠️ ¡Trampa!', '<p>Una losa se hunde bajo tus pies y saltan agujas desde las paredes.</p>' + UI.list(['❤️ -' + room.dmg + ' vida']) + UI.btn('Continuar', 'dg_ok', null, null, { cls: 'primary' }), 'dungeon'); }
  };
  A.dg_ok = () => UI.dgAfter('ok');

  /* ================= HOGAR Y FAMILIA ================= */
  A.home = (id) => UI.viewHome(W.poi(S(), id));
  UI.viewHome = function (poi) {
    const s = S(), P = s.player, f = s.family; UI.view = 'home'; UI.hud(); const sp = P.spouse && s.npcs[P.spouse];
    let h = '<p class="muted">Tu hogar en ' + esc(poi.name) + '.</p>';
    if (sp && sp.home === poi.id) h += '<h4>Tu pareja</h4><div class="npclist">' + npcCard(sp, 'home') + '</div>';
    else if (sp) h += '<p class="muted">' + esc(sp.name) + ' aún no vive aquí.</p>';
    h += '<h4>Hijos</h4>' + (f.children.length ? f.children.map((c) => '<div class="relcard">' + G.Port.html({ id: c.id, look: c.look }, 'alegre', { w: 64 }) + '<div><b>' + esc(c.name) + '</b> <small>' + Game.childAge(c) + ' años · ' + So.childTrait(c) + '</small><div class="meter"><i style="width:' + c.bond + '%"></i></div><small>Vínculo ' + c.bond + '/100' + (c.power ? ' · ' + D.POWERS[c.power].e + ' ' + D.POWERS[c.power].n : '') + '</small><div class="chips">' + UI.btn('🎈 Jugar', 'childact', c.id, 'jugar', { cls: 'mini' }) + UI.btn('📘 Enseñar', 'childact', c.id, 'ensenar', { cls: 'mini' }) + UI.btn('🎁 Regalo', 'childact', c.id, 'regalo', { cls: 'mini' }) + '</div></div></div>').join('') : '<p class="muted">Todavía no tienes hijos.</p>');
    if (f.pending) h += '<p class="ok">👶 Hay un bebé en camino (día ' + f.pending.day + ').</p>';
    h += '<div class="chips">' + UI.btn('🛏️ Dormir', 'homesleep', poi.id) + UI.btn('⏳ Pasar una semana', 'homeweek', poi.id)
      + (sp && sp.home === poi.id ? UI.btn('👶 Formar una familia', 'trychild', poi.id) : '') + UI.btn('🧒 Adoptar (100 ryo)', 'adopt', poi.id) + UI.btn('🚪 Salir', 'town', poi.id, null, { cls: 'ghost' }) + '</div>';
    UI.panel('🏠 Mi hogar', h, 'town');
  };
  A.childact = (cid, kind) => { const r = So.childAct(cid, kind); if (r) { UI.toast(r.text); UI.toasts(r.eff); } UI.hud(); UI.viewHome(W.poi(S(), S().family.home)); };
  A.homesleep = (id) => { const r = Game.rest('home'); UI.hud(); UI.autosave(); UI.panel('🛏️ Descanso', '<p>' + r.msg + '</p>' + UI.btn('Continuar', 'home', id, null, { cls: 'primary' }), 'town'); };
  A.homeweek = (id) => { const o = Game.advance(24 * 7); const d = Game.derived(S().player); S().player.hp = d.maxHp; S().player.en = d.maxEn; UI.hud(); UI.autosave(); UI.panel('⏳ Una semana en casa', '<p>Pasáis siete días tranquilos: tareas, risas y charlas junto al fuego.</p>' + UI.list(o.slice(0, 8)) + UI.btn('Continuar', 'home', id, null, { cls: 'primary' }), 'town'); };
  A.trychild = (id) => { const sp = S().npcs[S().player.spouse]; const r = So.tryChild(sp); UI.hud(); UI.toast(r.msg); UI.viewHome(W.poi(S(), id)); };
  A.adopt = (id) => { const r = So.adopt(); UI.toast(r.msg); UI.hud(); G.Sfx.play(r.ok ? 'love' : 'bad'); UI.viewHome(W.poi(S(), id)); };

  UI.familyHtml = function () {
    const s = S(), P = s.player, f = s.family, sp = P.spouse && s.npcs[P.spouse], home = f.home && W.poi(s, f.home);
    let h = '<p>' + (home ? '🏠 Hogar en <b>' + esc(home.name) + '</b>' : 'Aún no tienes casa. Cómprala en cualquier pueblo.') + '</p>';
    if (sp) h += '<h4>Pareja</h4><div class="relcard">' + G.Port.html(sp, sp.mood, { w: 70 }) + '<div><b>' + esc(NPC.fullName(sp)) + '</b><small>' + esc(NPC.jobName(sp)) + ' · ' + sp.age + ' años · afinidad ' + sp.affinity + '</small></div></div>';
    else h += '<p class="muted">No estás casad' + (P.gender === 'm' ? 'o' : 'a') + '. Conoce gente, ayúdala y quizá surja algo…</p>';
    h += '<h4>Hijos (' + f.children.length + ')</h4>' + (f.children.length ? f.children.map((c) => '<div class="relcard">' + G.Port.html({ id: c.id, look: c.look }, 'alegre', { w: 70 }) + '<div><b>' + esc(c.name) + '</b><small>' + Game.childAge(c) + ' años · ' + So.childTrait(c) + (c.asp ? ' · sueña con ser ' + c.asp : '') + ' · vínculo ' + c.bond + (c.power ? ' · ' + D.POWERS[c.power].e + D.POWERS[c.power].n : '') + '</small></div></div>').join('') : '<p class="muted">—</p>');
    return h + (f.pending ? '<p class="ok">👶 Bebé en camino.</p>' : '') + '<p class="hint">Si caes con muerte permanente, un hijo de 14+ años puede heredar tu historia.</p>';
  };
})((window.G = window.G || {}));
