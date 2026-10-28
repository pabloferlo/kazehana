/**
 * party.js — Personajes: estadísticas por nivel, equipo, experiencia, unidades de combate.
 */
import { Data, State, scaledBonus } from './state.js';

export const LEVEL_CAP = 70;                       // tope de esta versión (Ciudad de Luz sin Reloj completa)
/** Curva de experiencia: potencia hasta nivel 10; después crece ~25 % más rápido que el nivel (pensada hasta nivel 100). */
export const xpNeed = l => l <= 10 ? Math.round(20 * Math.pow(l, 1.7)) : Math.round(1003 * Math.pow(l / 10, 1.25));
/** Modificador de XP según la diferencia entre tu nivel y el del enemigo (anti-farmeo suave, bonus si vas por debajo). */
export const xpMod = (lvl, enemyLvl) => { const d = lvl - enemyLvl; return d >= 3 ? Math.max(0.4, 1 - 0.12 * (d - 2)) : d <= -3 ? Math.min(1.3, 1 + 0.05 * (-d - 2)) : 1; };

/** Definición de clase del personaje (el protagonista usa classes.json; Yukine, companions.json). */
export function classDef(char) {
  return char.id === 'yukine' ? Data.companions.yukine : Data.classes.classes.find(c => c.id === char.classId);
}

/** Estadísticas base de una clase en un nivel dado (sin equipo). */
export function statsAtLevel(def, level) {
  const s = {};
  for (const [k, v] of Object.entries(def.stats)) {
    const rate = k === 'hp' ? 0.12 : k === 'mp' ? 0.08 : 0.09;
    s[k] = Math.round(v * (1 + rate * (level - 1)));
  }
  return s;
}

/** Suma de bonus del equipo. */
export function equipBonus(char) {
  const b = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, spd: 0, ultGain: 0 };
  for (const id of Object.values(char.equipment || {})) {
    const it = Data.itemById[id]; if (!it?.bonus) continue;
    for (const [k, v] of Object.entries(scaledBonus(id))) b[k] = (b[k] || 0) + v;
  }
  return b;
}

/** Estadísticas totales (base + equipo). */
export function maxOf(char) {
  const base = statsAtLevel(classDef(char), char.level);
  const b = equipBonus(char);
  const out = {};
  for (const k of Object.keys(base)) out[k] = base[k] + (b[k] || 0);
  out.ultGain = b.ultGain || 0;
  return out;
}

export const isFainted = c => c.hp <= 0 || c.status === 'debilitado';

/** Mantiene PV/PM dentro de los máximos y sincroniza estado. */
export function clampChar(char) {
  const m = maxOf(char);
  char.hp = Math.max(0, Math.min(char.hp, m.hp));
  char.mp = Math.max(0, Math.min(char.mp, m.mp));
  char.status = char.hp <= 0 ? 'debilitado' : 'ok';
}

/** Da experiencia; devuelve niveles subidos y técnicas nuevas. */
export function gainXp(char, amount) {
  const res = { levels: 0, learned: [] };
  if (char.level >= LEVEL_CAP) return res;
  char.xp += amount;
  const def = classDef(char);
  while (char.level < LEVEL_CAP && char.xp >= xpNeed(char.level)) {
    char.xp -= xpNeed(char.level);
    const before = maxOf(char);
    char.level++; res.levels++;
    const after = maxOf(char);
    if (char.hp > 0) { char.hp += after.hp - before.hp; char.mp += after.mp - before.mp; }
    for (const l of def.learnset) {
      if (l.level === char.level && !char.techniques.known.includes(l.tech)) {
        char.techniques.known.push(l.tech); res.learned.push(l.tech);
        if (char.techniques.equipped.length < 4) char.techniques.equipped.push(l.tech);
      }
    }
  }
  if (char.level >= LEVEL_CAP) char.xp = 0;
  clampChar(char);
  return res;
}

/** Crea a Yukine al unirse al grupo. */
export function joinYukine() {
  const g = State.game;
  if (g.companions.yukine) return g.companions.yukine;
  const def = Data.companions.yukine;
  const level = Math.max(1, g.player.level);
  const known = def.learnset.filter(l => l.level <= level).map(l => l.tech);
  const y = { id: 'yukine', name: 'Yukine', level, xp: 0, hp: 1, mp: 1, status: 'ok',
    techniques: { known, equipped: known.slice(0, 4) }, equipment: {}, joined: true };
  const m = maxOf(y); y.hp = m.hp; y.mp = m.mp;
  g.companions.yukine = y;
  return y;
}

/** Personajes del grupo (protagonista + Yukine si se ha unido). */
export function partyChars() {
  const g = State.game;
  return [g.player, g.companions.yukine].filter(Boolean);
}

/** Cura (cantidad absoluta). Devuelve lo realmente curado. */
export function healChar(char, amount) {
  if (isFainted(char)) return 0;
  const m = maxOf(char), before = char.hp;
  char.hp = Math.min(m.hp, char.hp + amount);
  return char.hp - before;
}
export function fullRestore(char) {
  const m = maxOf(char); char.hp = m.hp; char.mp = m.mp; char.status = 'ok';
}
export function reviveChar(char, pct) {
  const m = maxOf(char); char.hp = Math.max(1, Math.round(m.hp * pct)); char.status = 'ok';
}

/** Convierte un personaje del grupo en unidad de combate. */
export function toUnit(char) {
  const m = maxOf(char), def = classDef(char);
  const yukineLocked = char.id === 'yukine' && !State.game.flags.wolf_unlocked;
  return {
    uid: 'a_' + char.id, id: char.id, name: char.name, side: 'ally', char,
    level: char.level, maxHp: m.hp, hp: char.hp, maxMp: m.mp, mp: char.mp,
    atk: m.atk, def: m.def, mag: m.mag, spd: m.spd, hybrid: !!def.hybrid,
    wolfAwakened: char.id === 'yukine' && !!State.game.flags.wolf_awakened,
    fx: {}, ult: Math.max(0, Math.min(100, char.ult || 0)), ultGain: m.ultGain, dodgeBonus: 0,
    techs: char.techniques.equipped.slice(0, 4),
    ultTech: yukineLocked ? null : def.ultimate
  };
}

/** Copia PV/PM de la unidad al personaje guardado. */
export function syncBack(unit) {
  if (unit.side !== 'ally') return;
  if (unit.wolfBonus) { unit.maxHp -= unit.wolfBonus; unit.wolfBonus = 0; }
  unit.char.ult = Math.max(0, Math.min(100, Math.round(unit.ult || 0)));   // la ulti se conserva entre combates
  unit.char.hp = Math.max(0, Math.min(unit.hp, unit.maxHp));
  unit.char.mp = Math.max(0, Math.min(unit.mp, unit.maxMp));
  unit.char.status = unit.char.hp <= 0 ? 'debilitado' : 'ok';
}
