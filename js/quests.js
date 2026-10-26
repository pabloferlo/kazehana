/**
 * quests.js — Misiones y evaluación de condiciones (cond) usadas en diálogos y mapa.
 * Estado en game.quests[id] = { status: 'active' | 'turned', base: {kills} }
 */
import { Data, State, countItem, removeItem, addItem, addGold, rollItem } from './state.js';

function objDone(q, o, st) {
  const g = State.game;
  if (o.type === 'flag') return !!g.flags[o.flag];
  if (o.type === 'item') return countItem(o.item) >= o.count;
  if (o.type === 'kill') return ((g.kills[o.enemy] || 0) - (st?.base?.[o.enemy] || 0)) >= o.count;
  return false;
}

/** Texto de progreso de un objetivo, p. ej. "Lobos (2/5)". */
export function objProgress(id, o) {
  const g = State.game, st = g.quests[id];
  if (o.type === 'item') return `${o.text} (${Math.min(countItem(o.item), o.count)}/${o.count})`;
  if (o.type === 'kill') return `${o.text} (${Math.min((g.kills[o.enemy] || 0) - (st?.base?.[o.enemy] || 0), o.count)}/${o.count})`;
  return o.text;
}

/** 'none' | 'active' | 'ready' | 'turned' */
export function questStatus(id) {
  const st = State.game.quests[id]; const q = Data.quests.quests[id];
  if (!st) return 'none';
  if (st.status === 'turned') return 'turned';
  return q.objectives.every(o => objDone(q, o, st)) ? 'ready' : 'active';
}

export function giveQuest(id) {
  const g = State.game;
  if (g.quests[id]) return false;
  g.quests[id] = { status: 'active', base: { ...g.kills } };
  return true;
}

/** Entrega la misión: consume objetos y da recompensas. Devuelve lista de líneas de recompensa. */
export function turnIn(id) {
  const q = Data.quests.quests[id]; if (questStatus(id) !== 'ready') return null;
  for (const o of q.objectives) if (o.type === 'item') removeItem(o.item, o.count);
  for (const [it, n] of q.consume || []) removeItem(it, n);
  State.game.quests[id].status = 'turned';
  const lines = [];
  const r = q.reward || {};
  if (r.gold) { addGold(r.gold); lines.push(`${r.gold} 🪙`); }
  for (const [sp, n] of r.items || []) { const it = rollItem(sp); if (!it) continue; addItem(it, n); lines.push(`${Data.itemById[it].name} ×${n}`); }
  return lines;
}

/** Misiones principales se completan solas al cumplir objetivos. */
export function autoCompleteMain() {
  const lines = [];
  for (const [id, q] of Object.entries(Data.quests.quests)) {
    if (q.type !== 'main') continue;
    const st = State.game.quests[id];
    if (!st && q.give !== undefined && (q.give === true || cond(q.give))) giveQuest(id);
    if (State.game.quests[id] && questStatus(id) === 'ready') { const l = turnIn(id); lines.push(`Misión completada: ${q.name}` + (l?.length ? ` (${l.join(', ')})` : '')); }
  }
  return lines;
}

/** Evalúa una condición o lista de condiciones (AND). */
export function cond(expr) {
  if (expr == null) return true;
  if (Array.isArray(expr)) return expr.every(cond);
  const g = State.game; const e = String(expr).trim();
  if (e.startsWith('!')) return !cond(e.slice(1));
  let m;
  if ((m = e.match(/^aff(>=|<)(\d+)$/))) return m[1] === '>=' ? g.romance.affinity >= +m[2] : g.romance.affinity < +m[2];
  if ((m = e.match(/^stage(>=|<)(\d+)$/))) return m[1] === '>=' ? g.romance.stage >= +m[2] : g.romance.stage < +m[2];
  if ((m = e.match(/^q:(\w+)=(\w+)$/))) return questStatus(m[1]) === m[2];
  if ((m = e.match(/^class:(\w+)$/))) return g.player.classId === m[1];
  return !!g.flags[e];
}
