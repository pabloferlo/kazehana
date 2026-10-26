/**
 * state.js — Estado global de la partida y carga de datos JSON.
 * Todo lo guardable vive en `State.game`.
 */
export const Data = {};

/** Señal para abortar una cadena de escenas (game over, etc.). */
export class Abort extends Error {}

const FILES = ['classes', 'techniques', 'regions', 'npcs', 'prologue', 'enemies', 'items', 'world', 'quests', 'companions', 'story', 'backgrounds', 'unison'];

/** Carga todos los JSON de /data. Requiere servidor HTTP (GitHub Pages sirve). */
export async function loadData() {
  await Promise.all(FILES.map(async f => {
    const r = await fetch(`data/${f}.json?v=13`);
    if (!r.ok) throw new Error(`No se pudo cargar data/${f}.json`);
    Data[f] = await r.json();
  }));
  indexData();
}

/** Crea índices rápidos por id a partir de los JSON. */
export function indexData() {
  Data.tech = Object.fromEntries(Data.techniques.techniques.map(t => [t.id, t]));
  Data.npcById = Object.fromEntries(Data.npcs.npcs.map(n => [n.id, n]));
  Data.itemById = Data.items.items;
}

export const State = { game: null };

export function newGame(player) {
  State.game = migrate({
    version: 2,
    player,
    companions: { yukine: null },   // se crea al unirse (ver party.joinYukine)
    flags: {},
    quests: {},                     // id -> 'active' | 'turned'
    kills: {},
    regions: { current: 'kasumi', liberated: [] },
    loc: null,
    visited: {},
    dungeons: {},                   // id -> índice de sala actual
    inventory: { gold: 60, items: { pocion_menor: 3, racion: 2 } },
    romance: { affinity: 0, stage: 0 },
    playtime: 0
  });
  return State.game;
}

/** Rellena campos que puedan faltar en partidas de versiones anteriores. */
export function migrate(g) {
  g.itemLv ||= {};
  g.flags ||= {}; g.quests ||= {}; g.kills ||= {}; g.visited ||= {}; g.dungeons ||= {};
  g.regions ||= { current: 'kasumi', liberated: [] };
  g.inventory ||= { gold: 0, items: {} };
  g.inventory.items ||= {};
  g.romance ||= { affinity: 0, stage: 0 };
  g.companions ||= { yukine: null };
  if (g.companions.yukine && !g.companions.yukine.joined && g.companions.yukine.joined !== undefined) g.companions.yukine = null;
  // Localizaciones nuevas que sustituyen a partes antiguas: si ya tenías el flag antiguo, se dan por completadas.
  try {
    for (const rg of Object.values(Data.world || {})) for (const l of Object.values(rg.locations || {})) {
      const f = l.dungeon?.rewards?.flag; if (f && l.autoDoneIf && g.flags[l.autoDoneIf]) g.flags[f] = true;
    }
  } catch (e) { /* datos aún sin cargar */ }
  // Armas de otra familia (p. ej. un bastón con un guerrero) vuelven al inventario
  try {
    const mine = [g.player, g.companions?.yukine].filter(Boolean);
    for (const c of mine) { const w = c.equipment?.weapon; if (w && Data.itemById?.[w] && !canEquip(c, w)) { delete c.equipment.weapon; g.inventory.items[w] = (g.inventory.items[w] || 0) + 1; } }
  } catch (e) { /* datos aún sin cargar */ }
  g.player.equipment ||= {};
  g.player.techniques.known ||= [];
  return g;
}

export function setGame(g) { State.game = migrate(g); }

/** Sustituye {name}, {age}... en los textos. */
export function fillTemplate(text, game = State.game) {
  const p = game?.player || {};
  return String(text)
    .replaceAll('{name}', p.name || 'Viajero')
    .replaceAll('{age}', p.age ?? '18')
    .replaceAll('{yearsLate}', Math.max(0, (p.age ?? 18) - 18));
}


/* ---- Rarezas y familias de arma ---- */
export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'celestial', 'divine', 'cosmic'];
export const RARITY_INFO = {
  common: ['Común', '#c9ccd6'], uncommon: ['Poco común', '#6fd37a'], rare: ['Raro', '#5aa8ff'], epic: ['Épico', '#b06cff'],
  legendary: ['Legendario', '#ffb43a'], mythic: ['Mítico', '#ff5a7a'], celestial: ['Celestial', '#6ff0ff'], divine: ['Divino', '#fff2a0'], cosmic: ['Cósmico', '#ff6cf0']
};
export const rarityName = r => RARITY_INFO[r]?.[0] || r || '';
export const rarityColor = r => RARITY_INFO[r]?.[1] || '#ccc';
export const FAMILY = { guerrero: 'filo', espadachin_magico: 'filo', mago_fuego: 'grimorio', mago_hielo: 'grimorio', mago_rayo: 'grimorio', mago_arcano: 'grimorio', monje_runico: 'guantelete', pistolero_arcano: 'pistola' };
export const FAMILY_NAME = { filo: 'Filo (espadas…)', grimorio: 'Grimorio', guantelete: 'Guanteletes', pistola: 'Pistola' };
export const familyOf = char => char?.id === 'yukine' ? 'grimorio' : (FAMILY[char?.classId] || null);
/** ¿Puede este personaje equipar este objeto? (las armas con familia solo las usa quien tiene esa familia) */
export function canEquip(char, id) {
  const it = Data.itemById?.[id]; if (!it) return false;
  if (it.slot !== 'weapon' || !it.wtype) return true;
  return familyOf(char) === it.wtype;
}
/** Convierte una recompensa "@w:rareza:tier" / "@a:…" / "@x:…" en un objeto concreto. Las armas se adaptan al protagonista:
 *  si usa filo/guantelete/pistola, 50 % su familia y 50 % grimorio (para Yukine); si es mago, siempre grimorio. */
export function rollItem(spec) {
  if (typeof spec !== 'string' || spec[0] !== '@') return spec;
  const [kind, rarity, tier] = spec.slice(1).split(':');
  const slot = { w: 'weapon', a: 'armor', x: 'accessory' }[kind];
  const all = Object.entries(Data.items.items).filter(([, v]) => v.slot === slot && v.rarity === rarity && String(v.tier) === tier);
  let pool = all;
  if (slot === 'weapon') {
    const pf = FAMILY[State.game?.player?.classId] || 'filo';
    const fam = pf === 'grimorio' ? 'grimorio' : (Math.random() < 0.5 ? pf : 'grimorio');
    pool = all.filter(([, v]) => v.wtype === fam);
    if (!pool.length) pool = all.filter(([, v]) => v.wtype === pf || v.wtype === 'grimorio');
  }
  if (!pool.length) pool = all;
  return pool.length ? pool[Math.floor(Math.random() * pool.length)][0] : null;
}

/* ---- Nivel de objeto (mejora de equipo) ---- */
export const RARITY_MAXLV = { common: 5, uncommon: 8, rare: 10, epic: 12, legendary: 15, mythic: 20, celestial: 24, divine: 26, cosmic: 30 };
export const ITEM_GROWTH = 0.08;   // +8 % de los bonus base por cada nivel por encima del 1
export const itemMax = id => RARITY_MAXLV[Data.itemById[id]?.rarity] || 1;
export const itemLevel = id => Math.min(itemMax(id), State.game?.itemLv?.[id] || 1);
export function scaledBonus(id, lv = itemLevel(id)) {
  const b = Data.itemById[id]?.bonus || {}, out = {};
  for (const [k, v] of Object.entries(b)) out[k] = (k === 'ultGain' || v <= 0) ? v : Math.round(v + (lv - 1) * Math.max(v * ITEM_GROWTH, 0.5));
  return out;
}
/** Coste en monedas de subir el objeto del nivel actual al siguiente (null si está al máximo). */
export function upgradeCost(id) {
  const it = Data.itemById[id], lv = itemLevel(id); if (!it || lv >= itemMax(id)) return null;
  return Math.max(40, Math.round((it.mprice || it.price * 2 || 100) * 0.04 * lv / 10) * 10);
}
export function upgradeItem(id) {
  const c = upgradeCost(id); if (c == null || State.game.inventory.gold < c) return false;
  State.game.inventory.gold -= c; State.game.itemLv ||= {}; State.game.itemLv[id] = itemLevel(id) + 1; return true;
}

/* ---- Inventario ---- */
export const items = () => State.game.inventory.items;
export const countItem = id => items()[id] || 0;
export function addItem(id, qty = 1) { items()[id] = (items()[id] || 0) + qty; }
export function removeItem(id, qty = 1) {
  const n = (items()[id] || 0) - qty;
  if (n > 0) items()[id] = n; else delete items()[id];
}
export function addGold(n) { State.game.inventory.gold = Math.max(0, State.game.inventory.gold + n); }
