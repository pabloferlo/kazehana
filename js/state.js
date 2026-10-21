/**
 * state.js — Estado global de la partida y carga de datos JSON.
 * Todo lo guardable vive en `State.game`.
 */
export const Data = {};

/** Señal para abortar una cadena de escenas (game over, etc.). */
export class Abort extends Error {}

const FILES = ['classes', 'techniques', 'regions', 'npcs', 'prologue', 'enemies', 'items', 'world', 'quests', 'companions', 'story'];

/** Carga todos los JSON de /data. Requiere servidor HTTP (GitHub Pages sirve). */
export async function loadData() {
  await Promise.all(FILES.map(async f => {
    const r = await fetch(`data/${f}.json?v=2`);
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
  g.flags ||= {}; g.quests ||= {}; g.kills ||= {}; g.visited ||= {}; g.dungeons ||= {};
  g.regions ||= { current: 'kasumi', liberated: [] };
  g.inventory ||= { gold: 0, items: {} };
  g.inventory.items ||= {};
  g.romance ||= { affinity: 0, stage: 0 };
  g.companions ||= { yukine: null };
  if (g.companions.yukine && !g.companions.yukine.joined && g.companions.yukine.joined !== undefined) g.companions.yukine = null;
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

/* ---- Inventario ---- */
export const items = () => State.game.inventory.items;
export const countItem = id => items()[id] || 0;
export function addItem(id, qty = 1) { items()[id] = (items()[id] || 0) + qty; }
export function removeItem(id, qty = 1) {
  const n = (items()[id] || 0) - qty;
  if (n > 0) items()[id] = n; else delete items()[id];
}
export function addGold(n) { State.game.inventory.gold = Math.max(0, State.game.inventory.gold + n); }
