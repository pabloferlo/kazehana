/**
 * guide.js — Guía de elementos: cómo funcionan debilidades/resistencias, tus elementos,
 * una tabla de tendencias calculada con los datos y lo que sabes de cada enemigo.
 */
import { el, openModal } from './ui.js';
import { Data, State } from './state.js';
import { ABILITIES } from './combat.js';

export const ELEMENTS = {
  fisico: ['⚔️', 'Físico', '#e8eefc'], fuego: ['🔥', 'Fuego', '#ff6a3d'], hielo: ['❄️', 'Hielo', '#8fd3ff'], rayo: ['⚡', 'Rayo', '#ffe14d'],
  arcano: ['🔮', 'Arcano', '#c27aff'], imbuido: ['✨', 'Imbuido', '#7affc9'], oscuro: ['🌑', 'Oscuro', '#8a5cff'], veneno: ['☠️', 'Veneno', '#8bd35a']
};
const STATUS_NAMES = { freeze: 'Congelación', stun: 'Aturdimiento', poison: 'Veneno', burn: 'Quemadura', slow: 'Lentitud' };
const chip = (el_, extra = '') => { const e = ELEMENTS[el_] || ['•', el_, '#ccc']; return el('span', { class: 'chip el-chip ' + extra, style: `border-color:${e[2]};color:${e[2]}` }, `${e[0]} ${e[1]}`); };

/** Anota una debilidad/resistencia descubierta al golpear a un enemigo. */
export function noteAffinity(enemyId, element, kind) {
  const g = State.game; if (!g) return;
  const s = (g.seenAff ||= {}); const e = (s[enemyId] ||= { weak: [], resist: [] });
  if (!e[kind].includes(element)) e[kind].push(element);
}

/** Elementos principales de una clase según sus técnicas de ataque. */
function classElements(classId) {
  const c = Data.classes.classes.find(x => x.id === classId); if (!c) return [];
  const n = {};
  for (const l of c.learnset) { const t = Data.tech[l.tech]; if (t?.type === 'attack' && t.element) n[t.element] = (n[t.element] || 0) + 1; }
  const u = Data.tech[c.ultimate]; if (u?.element) n[u.element] = (n[u.element] || 0) + 2;
  return Object.entries(n).sort((a, b) => b[1] - a[1]).map(x => x[0]);
}

function knownInfo(id) {
  const g = State.game, e = Data.enemies.enemies[id], seen = g?.seenAff?.[id] || { weak: [], resist: [] };
  const killed = (g?.kills?.[id] || 0) > 0;
  return { killed, weak: killed ? (e.weak || []) : seen.weak, resist: killed ? (e.resist || []) : seen.resist, immune: killed ? (e.immune || []) : [] };
}

function enemyRow(id) {
  const e = Data.enemies.enemies[id], k = knownInfo(id);
  const list = (arr, empty) => arr.length ? arr.map(a => chip(a)) : [el('small', { class: 'dim' }, empty)];
  return el('div', { class: 'gd-enemy' }, el('div', { class: 'gd-name' }, `${e.emoji} ${e.name}`, el('small', {}, ` Nv.${e.level}${e.boss ? ' · Jefe' : ''}`)),
    el('div', { class: 'gd-line' }, el('b', {}, 'Débil: '), ...list(k.weak, k.killed ? 'ninguna' : '? (golpéalo con distintos elementos)')),
    el('div', { class: 'gd-line' }, el('b', {}, 'Resiste: '), ...list(k.resist, k.killed ? 'ninguna' : '?')),
    k.killed && e.ability ? el('div', { class: 'gd-line' }, el('b', {}, 'Habilidad: '), el('small', {}, `${ABILITIES[e.ability][0]} — ${ABILITIES[e.ability][1]}` + (e.enrageAbility ? ` · En furia: ${ABILITIES[e.enrageAbility][0]}` : ''))) : null,
    k.immune.length ? el('div', { class: 'gd-line' }, el('b', {}, 'Inmune a: '), el('small', {}, k.immune.map(s => STATUS_NAMES[s] || s).join(', '))) : null);
}

/** Tendencias calculadas con todos los enemigos del juego: por elemento, cuántos son débiles / resistentes. */
function trendTable() {
  const rows = Object.keys(ELEMENTS).map(elm => {
    let w = 0, r = 0;
    for (const e of Object.values(Data.enemies.enemies)) { if (e.weak?.includes(elm)) w++; if (e.resist?.includes(elm)) r++; }
    return { elm, w, r };
  });
  const t = el('table', { class: 'gd-table' }, el('tr', {}, el('th', {}, 'Elemento'), el('th', {}, 'Enemigos débiles'), el('th', {}, 'Enemigos que resisten')));
  rows.forEach(x => t.append(el('tr', {}, el('td', {}, chip(x.elm)), el('td', {}, String(x.w)), el('td', {}, String(x.r)))));
  return t;
}

const STATES = [
  ['⚔️⬆', 'Ataque ↑', 'Tu ataque y magia ×1,35.', 'Los turnos que indique la técnica (normalmente 3-4).'],
  ['⚔️⬇', 'Ataque ↓', 'Ataque y magia ×0,7.', '2-3 turnos.'],
  ['🛡️⬆', 'Defensa ↑', 'Defensa ×1,4.', '2-4 turnos.'],
  ['🛡️⬇', 'Defensa ↓', 'Defensa ×0,7.', '2-3 turnos.'],
  ['💨⬆', 'Velocidad ↑', 'Velocidad ×1,4 (actúas antes y esquivas más).', '3 turnos.'],
  ['🐌', 'Lentitud', 'Velocidad ×0,7.', '3 turnos.'],
  ['🌀', 'Esquiva ↑', '+20 % de probabilidad de esquivar.', '2-3 turnos.'],
  ['💚', 'Regeneración', 'Recupera el 6 % de PV máximos al final de cada ronda.', '3-4 turnos.'],
  ['🔥', 'Quemadura', 'Pierde el 6 % de PV máximos al final de cada ronda (mínimo 3).', '3 turnos.'],
  ['☠️', 'Veneno', 'Pierde el 5 % de PV máximos al final de cada ronda (mínimo 3).', '3 turnos.'],
  ['🧊', 'Congelado', 'Pierde su siguiente turno y se interrumpe cualquier carga.', '1 turno (se consume al perder el turno).'],
  ['💫', 'Aturdido', 'Igual que congelado.', '1 turno.'],
  ['🐺', 'Forma de loba (Yukine)', 'Daño ×1,5, +10 % de crítico, +40 % de PV máximos (+60 % despierta) y regeneración 8 % (12 % despierta). Al aullar, los aliados reciben Ataque ↑ y un 25 % de curación.', '4 turnos (5 con la loba despierta).'],
  ['😾', 'Intimidación (habilidad de Yukine)', 'Al transformarse, el ataque y la magia de TODOS los rivales ×0,7. No se acumula con Ataque ↓. Los inmunes a Ataque ↓ no se ven afectados.', 'Mientras dure la forma de loba; se quita al destransformarse o si Yukine cae.']
];

export function openGuide(opts = {}) {
  const g = State.game, cls = g.player.classId;
  const mine = classElements(cls);
  const box = el('div', { class: 'guide' }, el('h3', {}, '📖 Guía de elementos'),
    el('h4', {}, 'Cómo funciona'),
    el('ul', {},
      el('li', {}, 'Los enemigos NO tienen un "tipo" fijo: cada uno tiene su propia lista de elementos a los que es Débil o Resistente.'),
      el('li', {}, el('b', {}, 'Débil'), ': tu ataque de ese elemento hace +50 % de daño y verás "¡DÉBIL!".'),
      el('li', {}, el('b', {}, 'Resiste'), ': el daño baja un 40 % y verás "RESISTE".'),
      el('li', {}, 'Si el elemento no está en ninguna lista, el daño es normal. No hay ventajas entre elementos por sí solos (el fuego no "gana" al hielo en general); depende del enemigo.'),
      el('li', {}, 'Tus personajes no tienen debilidades elementales: los ataques enemigos hacen el daño normal sea cual sea su elemento.'),
      el('li', {}, 'Inmune: algunos enemigos ignoran estados como congelar, aturdir o veneno (se indica abajo).'),
      el('li', {}, 'Lo que descubres se guarda: al golpear con un elemento al que es débil o resistente, se anota; al derrotarlo, se muestra todo.')),
    el('h4', {}, 'Tus elementos'),
    el('div', { class: 'gd-line' }, el('b', {}, `${g.player.name} (${Data.classes.classes.find(c => c.id === cls)?.name || cls}): `), ...mine.slice(0, 3).map((e, i) => chip(e, i === 0 ? 'main' : ''))),
    el('div', { class: 'gd-line' }, el('b', {}, 'Yukine: '), chip('hielo', 'main'), el('small', { class: 'dim' }, ' (también su forma de loba)')),
    el('h4', {}, 'Estados y habilidades'),
    el('small', { class: 'dim' }, 'La duración se cuenta en rondas: baja 1 al final de cada ronda (la ronda en que se aplica cuenta). Los estados duran lo que indica su técnica; los jefes con "furia" mantienen su Ataque ↑ hasta el final.'),
    ...STATES.map(x => el('div', { class: 'gd-line' }, el('b', {}, `${x[0]} ${x[1]}: `), x[2], el('small', { class: 'dim' }, ' Duración: ' + x[3]))),
    el('h4', {}, 'Tendencias del juego'),
    el('small', { class: 'dim' }, 'Cuántos enemigos del juego son débiles o resisten cada elemento. Orientativo: comprueba siempre el enemigo concreto.'),
    trendTable());
  const ids = opts.enemies || Object.keys(Data.enemies.enemies).filter(id => { const k = knownInfo(id); return k.killed || k.weak.length || k.resist.length; });
  box.append(el('h4', {}, opts.enemies ? 'Enemigos de este combate' : 'Enemigos conocidos'));
  if (!ids.length) box.append(el('small', { class: 'dim' }, 'Aún no has descubierto nada. Prueba distintos elementos en combate.'));
  [...new Set(ids)].forEach(id => box.append(enemyRow(id)));
  openModal(box);
}
