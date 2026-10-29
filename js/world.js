/**
 * world.js — Mapa explorable, viaje con encuentros, ciudades, posada, tienda y mazmorras.
 */
import { $, el, showScreen, toast, openModal, closeModal, openOverlay, closeOverlay, modalAsync, sleep, applyBgImage } from './ui.js';
import { Data, State, Abort, addItem, addGold, removeItem, countItem, items, rollItem, rarityName, rarityColor, canEquip, FAMILY } from './state.js';
import { saveSlot } from './storage.js';
import { runScenes, registerAction, addAffinity } from './story.js';
import { runBattle } from './combat_ui.js';
import { cond, autoCompleteMain } from './quests.js';
import { partyChars, fullRestore, isFainted, maxOf } from './party.js';

/** Ids de fondo de combate: lugar concreto → región → genérico. */
const bgIdsFor = loc => ['combate_' + loc, 'combate_' + State.game.regions.current, 'combate'];
const REGION = () => Data.world[State.game.regions.current];
const LOCS = () => REGION().locations;
const TYPE_LABEL = { town: 'Aldea', wild: 'Zona salvaje', sanctuary: 'Santuario', cave: 'Cueva opcional', tower: 'Torre del jefe', gate: 'Paso', ruins: 'Ruinas / fortaleza' };

export const autosave = () => saveSlot('auto', State.game);
let hooks = { openMenu: () => {}, gameOver: () => {} };
const sellBase = it => it ? (it.price || (it.mprice ? Math.round(it.mprice * 0.45) : 0)) : 0;
export function setHooks(h) { hooks = { ...hooks, ...h }; }

/** Ejecuta una función controlando el Abort (derrota, etc.). */
export async function safe(fn) {
  try { return await fn(); } catch (e) { if (e instanceof Abort) return null; throw e; }
}

/* ---------- Acciones para el motor de diálogos ---------- */
registerAction('battle', async a => {
  const r = await runBattle({ enemies: a.group, canFlee: a.canFlee, bg: a.bg, bgIds: bgIdsFor(State.game.loc) });
  if (r.result === 'win' && a.winFlag) State.game.flags[a.winFlag] = true;
  if (r.result === 'lose') {
    if (a.duel) { State.game.flags[a.loseFlag || 'duel_lost'] = true; partyChars().forEach(fullRestore); toast('Pierdes el duelo, pero nadie sale herido de gravedad.'); }
    else { hooks.gameOver(); throw new Abort('lose'); }
  }
  showScreen('story');
});
registerAction('bondcheck', async () => {
  const g = State.game;
  if (g.flags.couple && g.romance.stage === 4 && g.romance.affinity >= 36) { g.romance.stage = 5; toast('💞 Vuestro vínculo es ahora inseparable'); }
});
registerAction('shop', async () => { await openShop(currentTownShop()); });
registerAction('couplecheck', async () => {
  const g = State.game;
  if (g.flags.couple_pending && !g.flags.couple) { g.romance.stage = 4; g.flags.couple = true; toast('💞 Ahora Yukine y tú sois pareja'); }
  else if (!g.flags.couple && g.flags.confession_missed && g.romance.affinity >= 18) await runScenes('couple_event');
});

function currentTownShop() { return LOCS()[State.game.loc]?.town?.shop || []; }

/* ---------- Mapa ---------- */
let selected = null, moving = false;

function neighbors(id) {
  const out = new Set(LOCS()[id].links || []);
  for (const [k, l] of Object.entries(LOCS())) if ((l.links || []).includes(id)) out.add(k);
  return [...out];
}
const unlocked = id => cond(LOCS()[id].requires);

function findPath(from, to) {
  const prev = { [from]: null }, q = [from];
  while (q.length) {
    const c = q.shift(); if (c === to) break;
    for (const n of neighbors(c)) if (!(n in prev) && unlocked(n)) { prev[n] = c; q.push(n); }
  }
  if (!(to in prev)) return null;
  const path = []; for (let c = to; c; c = prev[c]) path.unshift(c);
  return path.slice(1);
}

function isDone(id) {
  const l = LOCS()[id]; const f = l.dungeon?.rewards?.flag;
  return f ? !!State.game.flags[f] : false;
}

export function showWorld() {
  const g = State.game, reg = REGION();
  g.loc ||= reg.start; selected ||= g.loc;
  const map = el('div', { class: 'map', style: `background:${reg.bg}` });
  applyBgImage(map, ['mapa_' + g.regions.current], 0.3);
  reg.decor.forEach(d => map.append(el('span', { class: 'decor', style: `left:${d.x}%;top:${d.y}%` }, d.e)));
  // caminos
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.classList.add('paths');
  const seen = new Set();
  for (const [id, l] of Object.entries(LOCS())) for (const t of l.links || []) {
    const key = [id, t].sort().join('|'); if (seen.has(key)) continue; seen.add(key);
    const o = LOCS()[t]; const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ln.setAttribute('x1', l.x); ln.setAttribute('y1', l.y); ln.setAttribute('x2', o.x); ln.setAttribute('y2', o.y);
    if (!unlocked(id) || !unlocked(t)) ln.classList.add('locked');
    svg.append(ln);
  }
  map.append(svg);
  for (const [id, l] of Object.entries(LOCS())) {
    const lock = !unlocked(id);
    const n = el('button', { class: `node ${l.type} ${lock ? 'locked' : ''} ${g.visited[id] ? 'visited' : ''} ${selected === id ? 'sel' : ''} ${id === g.loc ? 'here' : ''} ${isDone(id) ? 'done' : ''}`,
      style: `left:${l.x}%;top:${l.y}%`, title: l.name, onclick: () => { selected = id; showWorld(); } },
      el('span', { class: 'ni' }, lock ? '🔒' : l.icon), el('span', { class: 'nl' }, l.name), isDone(id) ? el('span', { class: 'ck' }, '✓') : null);
    map.append(n);
  }
  const here = LOCS()[g.loc];
  map.append(el('div', { class: 'token', id: 'token', style: `left:${here.x}%;top:${here.y}%` }, '🗡️'));

  const head = el('div', { class: 'w-head' },
    el('div', { class: 'w-title' }, el('b', {}, reg.name), el('small', {}, ` · Región ${reg.order || 1}/${Object.keys(Data.world).length}`)),
    el('div', { class: 'w-party' }, ...partyChars().map(c => {
      const m = maxOf(c);
      return el('div', { class: `pill ${isFainted(c) ? 'down' : ''}`, onclick: () => hooks.openMenu() },
        el('b', {}, c.name), el('small', {}, ` Nv${c.level}`),
        el('div', { class: 'bar hp' }, el('i', { style: `width:${c.hp / m.hp * 100}%` })),
        el('div', { class: 'bar mp' }, el('i', { style: `width:${c.mp / m.mp * 100}%` })));
    })),
    el('div', { class: 'w-gold' }, `🪙 ${g.inventory.gold}`),
    el('button', { class: 'btn', onclick: () => hooks.openMenu() }, '☰ Menú'),
    el('button', { class: 'btn', onclick: async () => { await autosave(); toast('Autoguardado'); } }, '💾'));

  $('#screen-world').replaceChildren(el('div', { class: 'world' }, head, el('div', { class: 'map-wrap' }, map), infoPanel()));
  showScreen('world');
}

function infoPanel() {
  const g = State.game, l = LOCS()[selected], here = selected === g.loc, lock = !unlocked(selected);
  const box = el('div', { class: 'w-info' },
    el('div', { class: 'wi-main' },
      el('h3', {}, `${l.icon} ${l.name}`, el('span', { class: 'badge' }, TYPE_LABEL[l.type] || ''), l.recommended ? el('span', { class: 'badge lv' }, `Nv. rec. ${l.recommended}`) : null, isDone(selected) ? el('span', { class: 'badge ok' }, 'Completado') : null),
      el('p', {}, lock ? `🔒 ${l.lockText || 'Bloqueado.'}` : l.desc)));
  const acts = el('div', { class: 'wi-actions' });
  if (!lock) {
    if (!here) acts.append(el('button', { class: 'btn primary', disabled: moving ? 'disabled' : null, onclick: () => safe(() => travel(selected)) }, '🧭 Viajar aquí'));
    else if (['town', 'sanctuary', 'cave', 'tower', 'gate', 'ruins'].includes(l.type)) acts.append(el('button', { class: 'btn primary', onclick: () => openEntry(selected) }, '⛩️ Entrar'));
    else if (l.encounters) acts.append(el('button', { class: 'btn primary', onclick: () => safe(() => explore(selected)) }, '🔍 Explorar la zona'));
  }
  box.append(acts); return box;
}

/* ---------- Viaje y encuentros ---------- */
async function travel(target) {
  if (moving) return;
  const g = State.game, path = findPath(g.loc, target);
  if (!path) return toast('No hay camino hasta ahí.');
  moving = true;
  try {
    for (const step of path) {
      const l = LOCS()[step], tok = $('#token');
      if (tok) { tok.style.left = l.x + '%'; tok.style.top = l.y + '%'; }
      await sleep(550);
      g.loc = step;
      const first = !g.visited[step]; g.visited[step] = true;
      if (first && l.onFirst) { await runScenes(l.onFirst); await autosave(); }
      for (const oa of l.onArrive || []) if (cond(oa.if)) await runScenes(oa.scene);
      if (l.encounters && Math.random() < l.encounters.rate && step !== target) { await encounter(l); }
      else if (l.encounters && step === target && Math.random() < l.encounters.rate * 0.6) await encounter(l);
      else if (Math.random() < 0.09) await randomEvent();
      showWorld();
      if (step !== target) await sleep(100);
    }
    await autosave();
  } finally { moving = false; }
  selected = target; showWorld();
  const l = LOCS()[target];
  if (['town', 'sanctuary', 'cave', 'tower', 'gate', 'ruins'].includes(l.type)) openEntry(target);
}

export async function randomEvent() {
  const g = State.game;
  const evs = (REGION().events || []).filter(e => !e.needYukine || g.flags.yukine_joined);
  if (!evs.length) return;
  const e = evs[Math.floor(Math.random() * evs.length)];
  if (e.merchant) return merchantEvent(e);
  const lines = [];
  if (e.gold) { addGold(e.gold); lines.push(`+${e.gold} 🪙`); }
  for (const sp of e.items || []) { const id = rollItem(sp); if (!id) continue; addItem(id, 1); lines.push(`Obtienes: ${Data.itemById[id]?.name || id}`); }
  if (e.aff) addAffinity(e.aff);
  if (e.heal) { partyChars().forEach(fullRestore); lines.push('El grupo se recupera.'); }
  await modalAsync(el('div', {}, el('h3', {}, '✨ Suceso en el camino'), el('p', {}, e.text), lines.length ? el('p', {}, el('small', {}, lines.join(' · '))) : null));
}

/** Mercader ambulante: vende lo más raro de la región (equipo adaptado a tu clase). Cada pieza de equipo es única. */
async function merchantEvent(e) {
  const m = e.merchant, I = Data.itemById, pf = FAMILY[State.game.player.classId] || 'filo';
  const ok = ([, v]) => v.type === 'equipment' && v.tier === m.tier && m.rarities.includes(v.rarity);
  const pool = Object.entries(I).filter(ok);
  const pick = (arr, n) => { const a = [...arr]; const out = []; while (a.length && out.length < n) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0][0]); return out; };
  const top = m.rarities[m.rarities.length - 1];
  const wp = pool.filter(([, v]) => v.slot === 'weapon' && (v.wtype === pf || v.wtype === 'grimorio'));
  const stock = [
    ...pick(wp.filter(([, v]) => v.wtype === pf), 1), ...pick(wp.filter(([, v]) => v.wtype === 'grimorio' && pf !== 'grimorio'), 1),
    ...pick(wp.filter(([, v]) => v.rarity === top), 1),
    ...pick(pool.filter(([, v]) => v.slot === 'armor'), 2), ...pick(pool.filter(([, v]) => v.slot === 'accessory'), 2),
    ...(m.bonusRarity && Math.random() < (m.bonusChance || 0) ? pick(Object.entries(I).filter(([, v]) => v.type === 'equipment' && v.tier === m.tier && v.rarity === m.bonusRarity && (v.slot !== 'weapon' || v.wtype === pf || v.wtype === 'grimorio')), 2) : []),
    ...(m.extra || [])
  ].filter((id, i, a) => a.indexOf(id) === i);
  await modalAsync(el('div', {}, el('h3', {}, `🧳 ${m.name}`), el('p', {}, e.text), el('p', {}, el('small', {}, 'Solo vende piezas únicas, y a precio de coleccionista. Quien tiene suerte ve algo más raro de lo normal.'))));
  await openShop(stock, { merchant: true, title: `🧳 ${m.name}` });
}

async function encounter(l) {
  const group = l.encounters.pool[Math.floor(Math.random() * l.encounters.pool.length)];
  const r = await runBattle({ enemies: group, intro: '¡Emboscada!', bgIds: bgIdsFor(State.game.loc) });
  if (r.result === 'lose') { hooks.gameOver(); throw new Abort('lose'); }
  await autosave(); showWorld();
}
async function explore(id) {
  const l = LOCS()[id]; await encounter(l); showWorld();
}

/* ---------- Tarjeta de entrada (ciudades / mazmorras) ---------- */
export function openEntry(id) {
  const l = LOCS()[id], g = State.game; const [c1, c2] = l.theme || ['#222', '#555'];
  const rooms = l.dungeon?.rooms.length;
  const prog = g.dungeons[id] || 0;
  const card = el('div', { class: 'entry', style: `--c1:${c1};--c2:${c2}` },
    el('div', { class: 'entry-glow' }),
    el('div', { class: 'entry-body' },
      el('div', { class: 'entry-type' }, TYPE_LABEL[l.type]),
      el('div', { class: 'entry-icon' }, l.icon),
      el('h1', {}, l.name),
      el('div', { class: 'entry-tag' }, l.tagline || ''),
      el('p', { class: 'entry-desc' }, l.desc),
      el('div', { class: 'chips center' },
        l.recommended ? el('span', { class: 'chip on' }, `Nivel recomendado ${l.recommended}`) : null,
        rooms ? el('span', { class: 'chip on' }, `${rooms} salas`) : null,
        rooms && prog > 0 && !isDone(id) ? el('span', { class: 'chip on' }, `Progreso ${prog}/${rooms}`) : null,
        l.optional ? el('span', { class: 'chip' }, 'Opcional · recompensas raras') : null,
        l.town?.inn ? el('span', { class: 'chip' }, '🛏️ Posada') : null, l.town?.shop ? el('span', { class: 'chip' }, '🛒 Tienda') : null,
        isDone(id) ? el('span', { class: 'chip on' }, '✓ Completado') : null),
      el('div', { class: 'entry-actions' },
        el('button', { class: 'btn primary big', onclick: () => enter(id) }, l.type === 'town' ? 'Entrar' : l.type === 'gate' ? 'Observar' : isDone(id) ? 'Revisitar' : 'Adentrarse'),
        el('button', { class: 'btn ghost', onclick: () => { closeOverlay(); showWorld(); } }, 'Volver al mapa'))));
  openOverlay(card, 'entry-ov'); applyBgImage(card, ['lugar_' + id], 0.5);
}
function enter(id) {
  const l = LOCS()[id];
  if (l.type === 'town') return openTown(id);
  if (l.type === 'gate') return enterGate(id);
  return openDungeon(id);
}

async function enterGate(id) {
  const l = LOCS()[id], g = State.game;
  if (!l.gate) return modalAsync(el('div', {}, el('h3', {}, l.name), el('p', {}, l.soon || 'Todavía no se puede avanzar por aquí.')));
  const go = await new Promise(res => openModal(el('div', {}, el('h3', {}, l.gate.title), el('p', {}, l.gate.text),
    el('div', { class: 'menu' }, el('button', { class: 'btn primary', onclick: () => { closeModal(); res(true); } }, 'Partir'), el('button', { class: 'btn', onclick: () => { closeModal(); res(false); } }, 'Quedarme')))));
  if (!go) return;
  closeOverlay();
  const first = !g.flags['gate_' + l.gate.region];
  g.flags['gate_' + l.gate.region] = true;
  g.regions.current = l.gate.region; g.loc = l.gate.loc; g.visited[l.gate.loc] = true; selected = null;
  if (first && l.gate.scene) await safe(() => runScenes(l.gate.scene));
  await autosave(); showWorld();
}

/* ---------- Ciudad ---------- */
export function openTown(id) {
  const l = LOCS()[id], g = State.game; const [c1, c2] = l.theme || ['#222', '#555'];
  const npcs = (l.town.npcs || []).map(n => Data.npcById[n]);
  const hub = el('div', { class: 'town', style: `--c1:${c1};--c2:${c2}` },
    el('div', { class: 'town-head' }, el('h1', {}, `${l.icon} ${l.name}`), el('p', {}, l.tagline || '')),
    el('div', { class: 'town-actions' },
      l.town.inn ? el('button', { class: 'btn', onclick: () => openInn(l.town.inn.price, id) }, `🛏️ Posada (${l.town.inn.price} 🪙)`) : null,
      l.town.shop ? el('button', { class: 'btn', onclick: async () => { await openShop(l.town.shop); openTown(id); } }, '🛒 Tienda') : null,
      el('button', { class: 'btn ghost', onclick: () => { closeOverlay(); showWorld(); } }, '← Salir')),
    el('h3', { class: 'sect' }, 'Gente del lugar'),
    el('div', { class: 'npc-grid' }, ...npcs.map(n => el('div', { class: 'npc-card' },
      el('div', { class: 'npc-ava' }, n.name[0]),
      el('div', { class: 'npc-txt' }, el('b', {}, n.name), el('small', {}, ` · ${n.role || ''}${n.age ? ` · ${n.age} años` : ''}`),
        el('p', {}, n.desc),
        el('button', { class: 'btn', onclick: () => talk(n, id) }, 'Hablar'))))));
  openOverlay(hub, 'town-ov'); applyBgImage(hub, ['lugar_' + id], 0.5);
}

async function talk(npc, townId) {
  closeOverlay();
  await safe(async () => {
    const topic = (npc.talk || []).find(t => cond(t.if));
    if (topic) await runScenes(topic.scenes);
  });
  showWorld(); await autosave();
  openTown(townId);
}

async function openInn(price, townId) {
  const g = State.game, couple = g.romance.stage >= 4;
  const rest = async (intimate) => {
    if (g.inventory.gold < price) return toast('No tienes suficiente dinero.');
    addGold(-price); closeOverlay(); closeModal2();
    await safe(async () => {
      if (intimate) { const sc = Data.story.intimate[Math.floor(Math.random() * Data.story.intimate.length)]; addAffinity(2); await runScenes(sc); }
      partyChars().forEach(fullRestore);
    });
    toast('Habéis descansado. Todos recuperados.');
    showWorld(); await autosave(); openTown(townId);
  };
  const closeModal2 = () => $('#modal').classList.add('hidden');
  openModal(el('div', {}, el('h3', {}, '🛏️ Posada del Arce Rojo'),
    el('p', {}, `Una noche de descanso restaura PV y PM de todos y revive a los debilitados. Precio: ${price} 🪙.`),
    el('div', { class: 'menu' }, el('button', { class: 'btn primary', onclick: () => rest(false) }, 'Descansar'),
      couple ? el('button', { class: 'btn', onclick: () => rest(true) }, '💞 Pedir habitación para dos') : null)));
}

/* ---------- Tienda ---------- */
export async function openShop(list, opts = {}) {
  const g = State.game; list = [...list];
  const priceOf = it => opts.merchant ? (it.mprice || it.price || 0) : it.price;
  let tab = 'buy';
  const body = el('div', {});
  const render = () => {
    const rows = [];
    if (tab === 'buy') {
      for (const id of list.filter(id => partyChars().some(c => canEquip(c, id)))) {
        const it = Data.itemById[id];
        rows.push(el('div', { class: 'shop-row' }, el('span', { class: 'si' }, it.icon),
          el('div', { class: 'sd' }, el('b', { style: it.rarity ? `color:${rarityColor(it.rarity)}` : null }, it.name), it.rarity ? el('span', { class: 'badge rar' }, rarityName(it.rarity)) : null, el('small', {}, ` ×${countItem(id)}`), el('p', {}, it.desc + (it.bonus ? '  ' + bonusText(it.bonus) : ''))),
          el('button', { class: 'btn', disabled: g.inventory.gold < priceOf(it) ? 'disabled' : null, onclick: () => { addGold(-priceOf(it)); addItem(id, 1); toast(`Compras ${it.name}`); if (opts.merchant && it.type === 'equipment') list.splice(list.indexOf(id), 1); render(); } }, `${priceOf(it)} 🪙`)));
      }
    } else {
      const eq = new Set(partyChars().flatMap(c => Object.values(c.equipment || {})));
      const sellable = Object.entries(items()).filter(([id, n]) => sellBase(Data.itemById[id]) && Data.itemById[id].type !== 'key' && !(eq.has(id) && n <= 1));
      if (!sellable.length) rows.push(el('p', {}, 'No tienes nada que vender.'));
      for (const [id, n] of sellable) {
        const it = Data.itemById[id], val = Math.floor(sellBase(it) * 0.4);
        rows.push(el('div', { class: 'shop-row' }, el('span', { class: 'si' }, it.icon), el('div', { class: 'sd' }, el('b', {}, it.name), el('small', {}, ` ×${n}`)),
          el('button', { class: 'btn', onclick: () => { removeItem(id, 1); addGold(val); render(); } }, `Vender ${val} 🪙`)));
      }
    }
    body.replaceChildren(el('h3', {}, opts.title || '🛒 Tienda'), el('div', { class: 'shop-gold' }, `Tu dinero: 🪙 ${g.inventory.gold}`),
      opts.merchant ? null : el('div', { class: 'tabs' }, el('button', { class: 'chip ' + (tab === 'buy' ? 'on' : ''), onclick: () => { tab = 'buy'; render(); } }, 'Comprar'),
        el('button', { class: 'chip ' + (tab === 'sell' ? 'on' : ''), onclick: () => { tab = 'sell'; render(); } }, 'Vender')), ...rows);
  };
  render(); await modalAsync(body);
}
export function bonusText(b) {
  const N = { hp: 'PV', mp: 'PM', atk: 'ATQ', def: 'DEF', mag: 'MAG', spd: 'VEL', ultGain: 'Carga ulti' };
  return Object.entries(b).map(([k, v]) => `${N[k] || k} +${v}`).join(' · ');
}

/* ---------- Mazmorras ---------- */
const ROOM = { battle: ['⚔️', 'Combate'], chest: ['📦', 'Cofre'], altar: ['⛩️', 'Altar de reposo'], story: ['📜', 'Escena'], boss: ['👹', 'Jefe'] };

export function openDungeon(id) {
  const l = LOCS()[id], g = State.game, d = l.dungeon, [c1, c2] = l.theme;
  const rerun = !!g.rerun?.[id];
  const idx = isDone(id) && !rerun ? d.rooms.length : (g.dungeons[id] || 0);
  const view = el('div', { class: 'dungeon', style: `--c1:${c1};--c2:${c2}` },
    el('div', { class: 'town-head' }, el('h1', {}, `${l.icon} ${l.name}`), el('p', {}, isDone(id) && !rerun ? (l.repeat ? l.repeat.text : 'Lugar completado.') : `${rerun ? 'Nuevo desafío · ' : ''}Sala ${Math.min(idx + 1, d.rooms.length)} de ${d.rooms.length}`)),
    el('div', { class: 'rooms' }, ...d.rooms.map((r, i) => {
      const state = i < idx ? 'done' : i === idx ? 'cur' : 'lock';
      return el('div', { class: `room ${state} ${r.type}` }, el('span', { class: 'ri' }, ROOM[r.type][0]),
        el('div', {}, el('b', {}, r.type === 'boss' ? `Jefe: ${Data.enemies.enemies[r.enemies[0]].name}` : ROOM[r.type][1]),
          el('small', {}, r.type === 'battle' ? r.enemies.map(e => Data.enemies.enemies[e].name).join(', ') : r.type === 'chest' ? 'Tesoro escondido' : r.type === 'altar' ? 'Recupera PV/PM' : '')));
    })),
    el('div', { class: 'town-actions' },
      !isDone(id) || rerun ? el('button', { class: 'btn primary big', onclick: () => safe(() => playRoom(id)) }, idx === 0 ? '▶ Comenzar' : '▶ Avanzar') : null,
      isDone(id) && !rerun && l.repeat ? el('button', { class: 'btn primary big', onclick: () => { (g.rerun ||= {})[id] = true; g.dungeons[id] = 0; closeOverlay(); openDungeon(id); } }, '🔁 Volver a desafiar') : null,
      el('button', { class: 'btn ghost', onclick: () => { closeOverlay(); showWorld(); } }, '← Salir')));
  openOverlay(view, 'dungeon-ov'); applyBgImage(view, ['lugar_' + id], 0.5);
}

async function playRoom(id) {
  const l = LOCS()[id], g = State.game, d = l.dungeon;
  const i = g.dungeons[id] || 0, room = d.rooms[i];
  closeOverlay();
  const advance = async () => { g.dungeons[id] = i + 1; await autosave(); };
  const rerun = !!g.rerun?.[id];
  if (room.type === 'story') { if (!rerun) await runScenes(room.scene); await advance(); if (rerun) return playRoom(id); }
  else if (room.type === 'battle') {
    const r = await runBattle({ enemies: room.enemies, bgIds: bgIdsFor(id), bg: `linear-gradient(180deg,${l.theme[0]},#0a0a14)` });
    if (r.result === 'lose') { hooks.gameOver(); return; }
    if (r.result === 'win') await advance();
  } else if (room.type === 'chest') {
    const lines = [];
    for (const [sp, n] of room.items || []) { const it = rollItem(sp); if (!it) continue; if (rerun && Data.itemById[it].type !== 'consumable') continue; addItem(it, n); lines.push(`${Data.itemById[it].icon} ${Data.itemById[it].name} ×${n}`); }
    const cg = rerun ? Math.round((room.gold || 0) / 2) : room.gold; if (cg) { addGold(cg); lines.push(`🪙 ${cg}`); }
    await modalAsync(el('div', {}, el('h3', {}, '📦 ¡Cofre abierto!'), ...lines.map(t => el('p', {}, t))));
    await advance();
  } else if (room.type === 'altar') {
    partyChars().forEach(fullRestore);
    await modalAsync(el('div', {}, el('h3', {}, '⛩️ Altar de reposo'), el('p', {}, 'Una luz suave os envuelve. PV y PM restaurados por completo.')));
    await advance();
  } else if (room.type === 'boss') {
    if (room.pre && !rerun) await runScenes(room.pre);
    const r = await runBattle({ enemies: room.enemies, canFlee: false, intro: `¡${Data.enemies.enemies[room.enemies[0]].name}!`, bgIds: bgIdsFor(id), bg: `radial-gradient(circle at 50% 30%,${l.theme[1]}55,${l.theme[0]} 60%,#05050a)` });
    if (r.result === 'lose') { hooks.gameOver(); return; }
    if (r.result === 'win') {
      if (room.post && !rerun) await runScenes(room.post);
      if (i >= d.rooms.length - 1) { if (rerun) await completeRerun(id); else await completeDungeon(id); await advance(); g.dungeons[id] = d.rooms.length; }
      else await advance();
    }
  }
  showWorld();
  if (!isDone(id) || room.type !== 'boss') openDungeon(id); else openEntry(id);
}

async function completeRerun(id) {
  const l = LOCS()[id], g = State.game, rp = l.repeat || {}; delete g.rerun[id];
  const lines = [];
  for (const [sp, n] of rp.items || []) { const it = rollItem(sp); if (!it) continue; addItem(it, n); const d = Data.itemById[it]; lines.push(`${d.icon} ${d.name}${n > 1 ? ' ×' + n : ''}`); }
  if (rp.gold) { addGold(rp.gold); lines.push(`🪙 ${rp.gold} monedas`); }
  await modalAsync(el('div', {}, el('h3', {}, `🔁 ¡${l.name} superado de nuevo!`), el('p', {}, 'Botín:'), ...lines.map(t => el('p', {}, t))));
  await autosave();
}

async function completeDungeon(id) {
  const l = LOCS()[id], g = State.game, rw = l.dungeon.rewards;
  g.flags[rw.flag] = true;
  const lines = [];
  for (const [sp, n] of rw.items || []) { const it = rollItem(sp); if (!it) continue; addItem(it, n); const d = Data.itemById[it]; lines.push(`${d.icon} ${d.name}${n > 1 ? ' ×' + n : ''}${d.rarity ? ` (${rarityName(d.rarity)})` : ''}`); }
  if (rw.gold) { addGold(rw.gold); lines.push(`🪙 ${rw.gold} monedas`); }
  const done = autoCompleteMain();
  await modalAsync(el('div', {}, el('h3', {}, `✨ ¡${l.name} completado!`), el('p', {}, 'Recompensas:'), ...lines.map(t => el('p', {}, t)),
    ...done.map(t => el('p', { class: 'ok' }, '✔ ' + t)), el('p', { class: 'hint' }, 'Los pergaminos se usan desde el Menú → Inventario para enseñar la técnica a un personaje.')));
  await autosave();
}

/** Primera llegada al mundo tras el prólogo o tras cargar. */
export async function startWorld() {
  const g = State.game, reg = REGION();
  g.loc ||= reg.start; selected = g.loc; moving = false;
  showWorld();
  if (!g.visited[g.loc]) {
    g.visited[g.loc] = true;
    const l = LOCS()[g.loc];
    if (l.onFirst) { await safe(() => runScenes(l.onFirst)); showWorld(); }
    await autosave();
  }
}
