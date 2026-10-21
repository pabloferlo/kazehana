/**
 * world.js — Mapa explorable, viaje con encuentros, ciudades, posada, tienda y mazmorras.
 */
import { $, el, showScreen, toast, openModal, openOverlay, closeOverlay, modalAsync, sleep } from './ui.js';
import { Data, State, Abort, addItem, addGold, removeItem, countItem, items } from './state.js';
import { saveSlot } from './storage.js';
import { runScenes, registerAction, addAffinity } from './story.js';
import { runBattle } from './combat_ui.js';
import { cond, autoCompleteMain } from './quests.js';
import { partyChars, fullRestore, isFainted, maxOf } from './party.js';

const REGION = () => Data.world[State.game.regions.current];
const LOCS = () => REGION().locations;
const TYPE_LABEL = { town: 'Aldea', wild: 'Zona salvaje', sanctuary: 'Santuario', cave: 'Cueva opcional', tower: 'Torre del jefe', gate: 'Paso' };

export const autosave = () => saveSlot('auto', State.game);
let hooks = { openMenu: () => {}, gameOver: () => {} };
export function setHooks(h) { hooks = { ...hooks, ...h }; }

/** Ejecuta una función controlando el Abort (derrota, etc.). */
export async function safe(fn) {
  try { return await fn(); } catch (e) { if (e instanceof Abort) return null; throw e; }
}

/* ---------- Acciones para el motor de diálogos ---------- */
registerAction('battle', async a => {
  const r = await runBattle({ enemies: a.group, canFlee: a.canFlee, bg: a.bg });
  if (r.result === 'lose') { hooks.gameOver(); throw new Abort('lose'); }
  showScreen('story');
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
    el('div', { class: 'w-title' }, el('b', {}, reg.name), el('small', {}, ' · Región 1/3')),
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
    else if (['town', 'sanctuary', 'cave', 'tower', 'gate'].includes(l.type)) acts.append(el('button', { class: 'btn primary', onclick: () => openEntry(selected) }, '⛩️ Entrar'));
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
      showWorld();
      if (step !== target) await sleep(100);
    }
    await autosave();
  } finally { moving = false; }
  selected = target; showWorld();
  const l = LOCS()[target];
  if (['town', 'sanctuary', 'cave', 'tower', 'gate'].includes(l.type)) openEntry(target);
}

async function encounter(l) {
  const group = l.encounters.pool[Math.floor(Math.random() * l.encounters.pool.length)];
  const r = await runBattle({ enemies: group, intro: '¡Emboscada!' });
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
  openOverlay(card, 'entry-ov');
}
function enter(id) {
  const l = LOCS()[id];
  if (l.type === 'town') return openTown(id);
  if (l.type === 'gate') return modalAsync(el('div', {}, el('h3', {}, 'Cumbres Shirogane'), el('p', {}, 'Has liberado Kasumi. La siguiente región (Cumbres Shirogane) llegará en la Parte 3. Mientras tanto, puedes completar las misiones y las cuevas que te queden, y subir de nivel.')));
  return openDungeon(id);
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
  openOverlay(hub, 'town-ov');
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
export async function openShop(list) {
  const g = State.game;
  let tab = 'buy';
  const body = el('div', {});
  const render = () => {
    const rows = [];
    if (tab === 'buy') {
      for (const id of list) {
        const it = Data.itemById[id];
        rows.push(el('div', { class: 'shop-row' }, el('span', { class: 'si' }, it.icon),
          el('div', { class: 'sd' }, el('b', {}, it.name), el('small', {}, ` ×${countItem(id)}`), el('p', {}, it.desc + (it.bonus ? '  ' + bonusText(it.bonus) : ''))),
          el('button', { class: 'btn', disabled: g.inventory.gold < it.price ? 'disabled' : null, onclick: () => { addGold(-it.price); addItem(id, 1); toast(`Compras ${it.name}`); render(); } }, `${it.price} 🪙`)));
      }
    } else {
      const eq = new Set(partyChars().flatMap(c => Object.values(c.equipment || {})));
      const sellable = Object.entries(items()).filter(([id, n]) => Data.itemById[id].price && Data.itemById[id].type !== 'key' && !(eq.has(id) && n <= 1));
      if (!sellable.length) rows.push(el('p', {}, 'No tienes nada que vender.'));
      for (const [id, n] of sellable) {
        const it = Data.itemById[id], val = Math.floor(it.price * 0.4);
        rows.push(el('div', { class: 'shop-row' }, el('span', { class: 'si' }, it.icon), el('div', { class: 'sd' }, el('b', {}, it.name), el('small', {}, ` ×${n}`)),
          el('button', { class: 'btn', onclick: () => { removeItem(id, 1); addGold(val); render(); } }, `Vender ${val} 🪙`)));
      }
    }
    body.replaceChildren(el('h3', {}, '🛒 Tienda'), el('div', { class: 'shop-gold' }, `Tu dinero: 🪙 ${g.inventory.gold}`),
      el('div', { class: 'tabs' }, el('button', { class: 'chip ' + (tab === 'buy' ? 'on' : ''), onclick: () => { tab = 'buy'; render(); } }, 'Comprar'),
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
  const idx = isDone(id) ? d.rooms.length : (g.dungeons[id] || 0);
  const view = el('div', { class: 'dungeon', style: `--c1:${c1};--c2:${c2}` },
    el('div', { class: 'town-head' }, el('h1', {}, `${l.icon} ${l.name}`), el('p', {}, isDone(id) ? 'Santuario completado.' : `Sala ${Math.min(idx + 1, d.rooms.length)} de ${d.rooms.length}`)),
    el('div', { class: 'rooms' }, ...d.rooms.map((r, i) => {
      const state = i < idx ? 'done' : i === idx ? 'cur' : 'lock';
      return el('div', { class: `room ${state} ${r.type}` }, el('span', { class: 'ri' }, ROOM[r.type][0]),
        el('div', {}, el('b', {}, r.type === 'boss' ? `Jefe: ${Data.enemies.enemies[r.enemies[0]].name}` : ROOM[r.type][1]),
          el('small', {}, r.type === 'battle' ? r.enemies.map(e => Data.enemies.enemies[e].name).join(', ') : r.type === 'chest' ? 'Tesoro escondido' : r.type === 'altar' ? 'Recupera PV/PM' : '')));
    })),
    el('div', { class: 'town-actions' },
      !isDone(id) ? el('button', { class: 'btn primary big', onclick: () => safe(() => playRoom(id)) }, idx === 0 ? '▶ Comenzar' : '▶ Avanzar') : null,
      el('button', { class: 'btn ghost', onclick: () => { closeOverlay(); showWorld(); } }, '← Salir')));
  openOverlay(view, 'dungeon-ov');
}

async function playRoom(id) {
  const l = LOCS()[id], g = State.game, d = l.dungeon;
  const i = g.dungeons[id] || 0, room = d.rooms[i];
  closeOverlay();
  const advance = async () => { g.dungeons[id] = i + 1; await autosave(); };
  if (room.type === 'story') { await runScenes(room.scene); await advance(); }
  else if (room.type === 'battle') {
    const r = await runBattle({ enemies: room.enemies, bg: `linear-gradient(180deg,${l.theme[0]},#0a0a14)` });
    if (r.result === 'lose') { hooks.gameOver(); return; }
    if (r.result === 'win') await advance();
  } else if (room.type === 'chest') {
    const lines = [];
    for (const [it, n] of room.items || []) { addItem(it, n); lines.push(`${Data.itemById[it].icon} ${Data.itemById[it].name} ×${n}`); }
    if (room.gold) { addGold(room.gold); lines.push(`🪙 ${room.gold}`); }
    await modalAsync(el('div', {}, el('h3', {}, '📦 ¡Cofre abierto!'), ...lines.map(t => el('p', {}, t))));
    await advance();
  } else if (room.type === 'altar') {
    partyChars().forEach(fullRestore);
    await modalAsync(el('div', {}, el('h3', {}, '⛩️ Altar de reposo'), el('p', {}, 'Una luz suave os envuelve. PV y PM restaurados por completo.')));
    await advance();
  } else if (room.type === 'boss') {
    if (room.pre) await runScenes(room.pre);
    const r = await runBattle({ enemies: room.enemies, canFlee: false, intro: `¡${Data.enemies.enemies[room.enemies[0]].name}!`, bg: `radial-gradient(circle at 50% 30%,${l.theme[1]}55,${l.theme[0]} 60%,#05050a)` });
    if (r.result === 'lose') { hooks.gameOver(); return; }
    if (r.result === 'win') {
      if (room.post) await runScenes(room.post);
      await completeDungeon(id);
      await advance(); g.dungeons[id] = d.rooms.length;
    }
  }
  showWorld();
  if (!isDone(id) || room.type !== 'boss') openDungeon(id); else openEntry(id);
}

async function completeDungeon(id) {
  const l = LOCS()[id], g = State.game, rw = l.dungeon.rewards;
  g.flags[rw.flag] = true;
  const lines = [];
  for (const [it, n] of rw.items || []) { addItem(it, n); const d = Data.itemById[it]; lines.push(`${d.icon} ${d.name}${n > 1 ? ' ×' + n : ''}${d.rarity ? ` (${d.rarity})` : ''}`); }
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
