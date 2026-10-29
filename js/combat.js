/**
 * combat.js — Motor de combate por turnos (lógica pura, sin DOM).
 *
 * Ronda:  startRound() → el enemigo muestra su intención
 *         resolve(acciones) → se ejecutan todas las acciones por velocidad
 * Cada método devuelve una lista de eventos que la interfaz reproduce.
 *
 * Estados (unit.fx = { nombre: turnosRestantes }):
 *   burn/poison (daño por turno), slow, freeze/stun (pierde el turno),
 *   atk_up/atk_down, def_up/def_down, spd_up, dodge_up, regen, wolf (forma de loba),
 *   intimidate (habilidad de Yukine: ataque ↓ a los rivales hasta que acabe la forma de loba)
 */
import { Data, State, rollItem } from './state.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = () => Math.random();
const pick = arr => arr[Math.floor(rnd() * arr.length)];

export const STATUS_INFO = {
  burn: ['🔥', 'Quemadura'], poison: ['☠️', 'Veneno'], slow: ['🐌', 'Lentitud'],
  freeze: ['🧊', 'Congelado'], stun: ['💫', 'Aturdido'],
  atk_up: ['⚔️⬆', 'Ataque ↑'], atk_down: ['⚔️⬇', 'Ataque ↓'],
  def_up: ['🛡️⬆', 'Defensa ↑'], def_down: ['🛡️⬇', 'Defensa ↓'],
  spd_up: ['💨⬆', 'Velocidad ↑'], dodge_up: ['🌀', 'Esquiva ↑'],
  regen: ['💚', 'Regeneración'], wolf: ['🐺', 'Forma de loba'], intimidate: ['😾', 'Intimidación'], intimidated: ['😾⬇', 'Intimidado']
};

/** Habilidades pasivas de enemigos (como las de Pokémon). enemies.json: "ability": id, "enrageAbility": id (cambia al entrar en furia). */
export const ABILITIES = {
  intimidacion: ['Intimidación', 'Mientras esté en pie, el ataque y la magia de tu equipo bajan ×0,7.'],
  dureza: ['Dureza', 'Recibe un 15 % menos de daño.'],
  espinas: ['Espinas', 'Devuelve un 8 % del daño de los ataques físicos al atacante.'],
  aura_helada: ['Aura Helada', 'Mientras esté en pie, la velocidad de tu equipo baja ×0,7.'],
  aura_brasas: ['Aura de Brasas', 'Al final de cada ronda quema a tu equipo (4 % de sus PV máximos).'],
  regeneracion: ['Regeneración', 'Recupera un 3 % de sus PV máximos al final de cada ronda.'],
  evasion: ['Evasión', '+12 % de probabilidad de esquivar.'],
  fragilidad: ['Fragilidad', 'Su defensa baja, y su daño y su velocidad suben de forma permanente hasta que cae.'],
  ilusion: ['Ilusión', 'Esquiva siempre el primer ataque que recibe en las rondas impares (1, 3, 5…). En las pares puede recibirlos todos.'],
  amor_filial: ['Amor filial', 'Tras cada ataque, golpea otra vez al mismo objetivo con un 20 % de la potencia.'],
  pararrayos: ['Pararrayos', 'El daño de elemento rayo se reduce a un cuarto y le cura un 2 % de sus PV.'],
  sobrecarga: ['Sobrecarga', 'Al final de cada ronda un rayo cae sobre un miembro al azar de tu equipo (5 % de sus PV máximos).'],
  duelo: ['Duelo', 'Cada vez que un miembro de tu equipo cae, su ataque y su velocidad suben de forma permanente.'],
  tiempo_detenido: ['Tiempo Detenido', 'Cada 3 rondas (3, 6, 9…) anula todas las mejoras de tu equipo: no te conviene potenciarte justo antes.'],
  velo_nocturno: ['Velo Nocturno', 'Los ataques físicos le hacen un 30 % menos de daño: la noche difumina el filo.'],
  silencio: ['Silencio', 'Tu equipo carga la ulti y la unión a menos de la mitad de velocidad.'],
  sol_radiante: ['Sol Radiante', 'Sus ataques de fuego y rayo hacen un 30 % más de daño, y tus ataques de hielo, un 20 % menos.'],
  plegaria: ['Plegaria', 'Cada 3 rondas recupera un 8 % de sus PV máximos.'],
  espejo: ['Espejo', 'Refleja a quien ataca un 20 % del daño de los ataques no físicos.'],
  insomnio: ['Insomnio', 'No puede ser aturdido, congelado ni ralentizado, y cada vez que lo intentas se cura un 3 % de sus PV.'],
  panico: ['Pánico', 'Cuanto más herido está, más peligroso: por debajo del 75 % de PV sube su ataque, por debajo del 50 % su velocidad (permanente).'],
  polen: ['Polen Somnífero', 'Cada 4 rondas duerme (aturde 1 turno) a un miembro al azar de tu equipo.'],
  latido: ['Latido del Sol', 'Cada 4 rondas un latido de luz hace a todo tu equipo un 8 % de sus PV máximos (la mitad si te defiendes).'],
  nana: ['Canción de Cuna', 'Cada 3 rondas tu equipo pierde un 10 % de su MP y 10 puntos de carga de ulti.'],
  marca: ['Haz del Faro', 'Cada ronda marca a un miembro de tu equipo: el siguiente turno enemigo le hace un 25 % más de daño.'],
  aullido: ['Aullido de Manada', 'Cada 3 rondas aúlla y sube su ataque durante 3 rondas.'],
  concha: ['Concha', 'El primer golpe que recibe cada ronda hace solo un 50 % del daño.'],
  ancla: ['Ancla', 'Sus golpes tienen un 30 % de anclar (ralentizar) a quien los recibe.'],
  mareas: ['Mareas', 'Las rondas impares es pleamar (recibe un 20 % menos de daño y se cura un 3 %); las pares, bajamar (recibe un 25 % más).'],
  prisma: ['Prisma', 'Se adapta: el elemento con el que le golpeaste la ronda anterior le hace un 40 % menos de daño. Varía tus elementos.'],
  tsunami: ['Tsunami', 'Cada 4 rondas una ola golpea a todo tu equipo (18 % de PV máx.). Se anuncia la ronda anterior: defenderse la anula por completo.'],
  contraluz: ['Contraluz', 'Su luz te deslumbra: tu equipo no puede asestar golpes críticos contra ella.'],
  succion: ['Succión', 'Al final de cada ronda drena un 6 % del MP máximo de cada miembro de tu equipo y se cura un 0,8 % de sus PV por cada uno.'],
  aguijon: ['Aguijón Venenoso', 'Sus ataques tienen un 40 % de envenenar a quien los recibe.'],
  casco: ['Casco de Cristal', 'Ningún golpe puede quitarle más del 4 % de sus PV máximos de una vez.'],
  fases: ['Fases de la Luna', 'Ciclo de 4 rondas: luna nueva (1, recibe un 20 % más de daño), creciente (2), llena (3, su ataque sube un 35 %) y menguante (4).'],
  eco_devuelto: ['Eco Devuelto', 'Acumula el daño que recibe; cada 3 rondas lo devuelve como eco a todo tu equipo (12 % de lo acumulado a cada uno, máx. 20 % de sus PV).'],
  camara_eco: ['Cámara de Eco', 'Cada técnica que gasta MP te devuelve un eco: quien la lanza pierde un 4 % de sus PV máximos. Los ataques básicos no lo provocan.'],
  voz_robada: ['Voz Robada', 'Mientras esté en pie, tus curaciones funcionan a la mitad.'],
  rayo_mudo: ['Rayo Mudo', 'Cada 3 rondas un rayo silencioso cae sobre quien más MP tiene: se lo vacía y le hace un 12 % de sus PV máximos.'],
  archivo: ['Archivo', 'Lo que ya ha leído no le sorprende: repetir la misma técnica dos turnos seguidos (quien la lance) le hace un 40 % menos de daño.'],
  cristalizacion: ['Cristalización', 'Cada golpe que recibe lo endurece un 3 % más (máx. 30 %). Un golpe crítico lo rompe y reinicia la capa.'],
  contrapunto: ['Contrapunto', 'Cada 4 rondas, al final de la ronda, ataca una vez más.'],
  avalancha: ['Avalancha', 'Cada 3 rondas una avalancha cae sobre quien tiene menos PV (en %): le hace un 15 % de sus PV máximos (la mitad si se defiende).'],
  replica: ['Réplica', 'Cada vez que tu equipo se potencia, ella se potencia igual.'],
  conjuncion: ['Conjunción', 'Cuando golpea a un solo objetivo, el resto de tu equipo recibe un 20 % de ese daño.'],
  reverberacion: ['Reverberación', 'Al final de cada ronda repite con la mitad de potencia el último ataque que lanzó tu equipo, contra quien lo lanzó.'],
  ventisca_callada: ['Ventisca Callada', 'Al final de cada ronda cada miembro de tu equipo tiene un 25 % de quedar ralentizado.'],
  rebobinado: ['Rebobinado', 'La primera vez que iba a caer, el tiempo retrocede: se recupera hasta el 50 % de sus PV (una vez por combate).'],
  reloj_arena: ['Reloj de Arena', 'Su ataque sube un 6 % por ronda (máx. +60 %). Ralentizarla reinicia la cuenta.'],
  sobrecalentamiento: ['Sobrecalentamiento', 'Cada ronda acumula calor; al llegar a 5 libera una explosión (18 % de los PV máx. a todo tu equipo, la mitad si te defiendes). Los ataques de hielo le quitan 2 de calor.'],
  paginas: ['Escudo de Páginas', 'Un escudo de páginas absorbe el 15 % de sus PV máximos de daño y se regenera cada 4 rondas. Rómpelo de golpe.'],
  dualidad: ['Dualidad', 'Las rondas impares recibe la mitad del daño físico; las pares, la mitad del daño no físico. Combina elementos.'],
  olvido: ['Aura de Olvido', 'Cada ronda, cada miembro de tu equipo tiene un 15 % de olvidar qué hacía y perder el turno.'],
  foco: ['Foco de Escena', 'Cada ronda pone el foco sobre quien más daño hizo la ronda anterior: recibirá un 40 % más de daño hasta que otro lo supere.'],
  eterno_retorno: ['Eterno Retorno', 'Ningún golpe le quita más del 4 % de sus PV máximos. Cada 5 rondas recupera un 5 % y borra todas tus mejoras: solo un ataque de Unión puede interrumpirlo.'],
  dia_noche: ['Día y Noche', 'Alterna Día y Noche cada 2 rondas. De Día, el fuego y lo arcano le hacen solo un 15 %; de Noche, lo oscuro y el hielo. Lleva elementos variados.'],
  contraataque: ['Contragolpe', 'Cuando la golpean, un 25 % de las veces responde de inmediato con un contragolpe físico.'],
  siega: ['Siega', 'Sus ataques hacen un 40 % más de daño a quien tiene menos de la mitad de sus PV: remata a los heridos.'],
  paja: ['Relleno de Paja', 'Los golpes físicos le hacen un 30 % menos de daño, pero el fuego le hace un 60 % más.'],
  anochecer: ['Anochecer', 'La luz baja: cada ronda esquiva un 3 % más (máx. +30 %).'],
  crepusculo: ['Crepúsculo', 'Por debajo del 50 % de PV cae la noche: sus ataques de oscuro y arcano hacen un 35 % más y tus curaciones funcionan al 70 %.'],
  bruma: ['Bruma Matinal', 'Una bruma dorada desvía el 25 % de los ataques de tu equipo contra ella.'],
  rosal: ['Rosal de Contragolpe', 'Cada golpe crítico que recibe hiere a quien lo asestó (10 % de sus PV máximos).'],
  cosecha: ['Cosecha', 'Cada vez que un miembro de tu equipo cae, recupera un 15 % de sus PV máximos.'],
  centella: ['Centella Matutina', 'No tolera otra luz: quien se transforma (ulti de lobo) recibe una centella del 15 % de sus PV máximos.'],
  sol_fijo: ['Sol Fijo', 'Cada 3 rondas (3, 6, 9…) el sol se detiene sobre ella y recibe un 70 % menos de daño. Se anuncia la ronda anterior: guarda tus golpes fuertes.'],
  cobro: ['Cobro de Intereses', 'Cura un 25 % del daño que inflige a tu equipo.'],
  protocolo: ['Protocolo', 'Cada ronda decreta un elemento prohibido: los ataques de ese elemento le hacen un 75 % menos de daño. Se anuncia al empezar la ronda.'],
  sin_sombra: ['Luz sin Sombra', 'Su luz no deja dónde esconderse: sus ataques ignoran un 35 % de tu defensa y tus esquivas no funcionan contra ella.'],
  ultima_palabra: ['Última Palabra', 'Con menos del 25 % de PV, al final de cada ronda ataca una vez más.'],
  ambar: ['Ámbar', 'Cada ataque físico que recibe tiene un 35 % de ralentizar a quien lo hizo.']
};

/** Crea una unidad enemiga a partir de enemies.json. */
export function makeEnemy(id, idx) {
  const d = Data.enemies.enemies[id];
  if (!d) throw new Error('Enemigo desconocido: ' + id);
  return {
    uid: 'e_' + idx, id, name: d.name, side: 'enemy', def: d, level: d.level,
    maxHp: d.hp, hp: d.hp, maxMp: 0, mp: 0,
    atk: d.atk, def_: d.def, mag: d.mag, spd: d.spd, hybrid: false,
    get defStat() { return this.def_; },
    fx: {}, ult: 0, dodgeBonus: d.dodgeBonus || 0,
    weak: d.weak || [], resist: d.resist || [], immune: d.immune || [],
    emoji: d.emoji, color: d.color, boss: !!d.boss, turns: 0, charging: null, intent: null, enraged: false
  };
}

export class Battle {
  /**
   * @param {object[]} allies   unidades aliadas (party.toUnit)
   * @param {object[]} enemies  unidades enemigas (makeEnemy)
   * @param {object} opts       { canFlee, bg }
   */
  constructor(allies, enemies, opts = {}) {
    this.allies = allies; this.enemies = enemies; this.opts = { canFlee: true, ...opts };
    this.round = 0; this.over = false; this.result = null; this.events = [];
    this.defeated = [];
    this.unison = opts.unison || null;   // ataque de Unión (protagonista + Yukine) o null
    this.bond = 0;                       // Vínculo 0-100, solo dentro del combate
  }
  bondAdd(n) { if (this.unison) this.bond = Math.min(100, this.bond + n); }
  unisonPartners() {
    const p = this.allies.find(a => a.id === 'protagonista' && a.hp > 0), y = this.allies.find(a => a.id === 'yukine' && a.hp > 0);
    return p && y ? { p, y } : null;
  }
  canUnison() { return !!this.unison && this.bond >= 100 && !!this.unisonPartners(); }
  get all() { return [...this.allies, ...this.enemies]; }
  byUid(uid) { return this.all.find(u => u.uid === uid); }
  alive(side) { return (side === 'ally' ? this.allies : this.enemies).filter(u => u.hp > 0); }
  foes(u) { return u.side === 'ally' ? this.enemies : this.allies; }
  friends(u) { return u.side === 'ally' ? this.allies : this.enemies; }
  ev(e) { this.events.push(e); }
  flush() { const e = this.events; this.events = []; return e; }

  /* ---------- Estadísticas efectivas ---------- */
  S(u, k) {
    let v = k === 'def' ? (u.def_ ?? u.def) : u[k];
    const f = u.fx;
    if ((k === 'atk' || k === 'mag') && f.atk_up) v *= 1.35;
    if ((k === 'atk' || k === 'mag') && (f.atk_down || f.intimidate || f.intimidated)) v *= 0.7;
    if (k === 'def' && f.def_up) v *= 1.4;
    if (k === 'def' && f.def_down) v *= 0.7;
    if (k === 'spd') { if (f.spd_up) v *= 1.4; if (f.slow) v *= 0.7; }
    return v;
  }

  /* ---------- Inicio de ronda ---------- */
  startRound() {
    this.round++;
    this.events = [];
    for (const u of this.all) u.defending = false;
    this.ev({ t: 'round', n: this.round });
    if (this.round === 1) {
      for (const e of this.enemies) { this.setAbility(e, e.def.ability || null); if (e.ability && ABILITIES[e.ability]) this.ev({ t: 'msg', text: `${e.name}: habilidad «${ABILITIES[e.ability][0]}». ${ABILITIES[e.ability][1]}`, target: e.uid }); }
      this.refreshAuras();
    }
    for (const e of this.alive('enemy')) this.decideIntent(e);
    return this.flush();
  }

  /** Asigna la habilidad de un enemigo; Fragilidad aplica sus efectos permanentes. */
  setAbility(e, id) {
    e.ability = id;
    if (id === 'fragilidad') { e.fx.def_down = 99; e.fx.atk_up = 99; e.fx.spd_up = 99; this.ev({ t: 'status', target: e.uid, status: 'def_down', text: 'Fragilidad', fx: { ...e.fx } }); }
  }

  /** Auras de habilidades enemigas sobre el equipo aliado (se recalculan al caer un enemigo o cambiar de habilidad). */
  refreshAuras() {
    const has = id => this.alive('enemy').some(e => e.ability === id);
    for (const a of this.allies) {
      if (a.hp <= 0) continue;
      const want = { intimidated: has('intimidacion'), slow: has('aura_helada') };
      for (const [k, on] of Object.entries(want)) {
        if (on && a.fx[k] !== 99) { a.fx[k] = 99; this.ev({ t: 'status', target: a.uid, status: k, text: STATUS_INFO[k][1], fx: { ...a.fx } }); }
        else if (!on && a.fx[k] === 99) { delete a.fx[k]; this.ev({ t: 'fxclear', target: a.uid, fx: { ...a.fx } }); }
      }
    }
  }

  pickTarget(e, skill) {
    const foes = this.alive('ally'); if (!foes.length) return null;
    if (rnd() < 0.25) return foes.reduce((a, b) => (a.hp / a.maxHp <= b.hp / b.maxHp ? a : b)).uid;
    return pick(foes).uid;
  }

  decideIntent(e) {
    if (e.charging) { e.intent = { skill: e.charging, exec: true, target: this.pickTarget(e, e.charging) }; return; }
    e.turns++;
    const d = e.def; let skill;
    if (d.ultimate && e.turns % d.ultimate.every === 0) skill = { ...d.ultimate, isUlt: true };
    else {
      const pool = d.skills.filter(s => !s.minRound || this.round >= s.minRound);
      const total = pool.reduce((a, s) => a + (s.weight || 1), 0);
      let r = rnd() * total; skill = pool[0];
      for (const s of pool) { r -= (s.weight || 1); if (r <= 0) { skill = s; break; } }
    }
    if (skill.charge) e.intent = { skill, charging: true };
    else e.intent = { skill, target: skill.target === 'enemy' ? this.pickTarget(e, skill) : null };
  }

  /** Texto descriptivo de la intención para la interfaz. */
  describeIntent(e) {
    if (e.hp <= 0) return null;
    if (e.fx.freeze || e.fx.stun) return { icon: '💤', text: 'Incapacitado', kind: 'disabled' };
    const it = e.intent; if (!it) return null;
    const s = it.skill;
    if (it.charging) return { icon: '⏳', text: `Cargando: ${s.name}`, kind: 'charge' };
    if (it.exec) return { icon: '💥', text: `¡${s.name}!`, kind: 'exec' };
    const type = s.type || 'attack';
    if (type === 'buff') return { icon: '✨', text: s.name, kind: 'buff' };
    if (type === 'debuff') return { icon: '🌀', text: `${s.name}`, kind: 'debuff' };
    const tgt = s.target === 'all_enemies' ? 'a todos' : (this.byUid(it.target)?.name ?? '');
    return { icon: s.target === 'all_enemies' ? '🌊' : '⚔️', text: `${s.name} → ${tgt}`, kind: 'attack', target: it.target };
  }

  /* ---------- Resolución de la ronda ---------- */
  resolve(actions) {
    this.events = [];
    const acts = [];
    const uni = actions.find(a => a.kind === 'unison' && this.canUnison());
    if (uni) actions = [uni];             // la Unión consume el turno de los dos
    for (const a of actions) {
      const unit = this.byUid(a.actor); if (!unit || unit.hp <= 0) continue;
      if (a.kind === 'unison' && a !== uni) continue;
      const prio = a.kind === 'unison' ? 4 : a.kind === 'defend' ? 3 : (a.kind === 'item' ? 2 : a.kind === 'flee' ? 1 : 0);
      acts.push({ ...a, unit, prio });
    }
    for (const e of this.alive('enemy')) acts.push({ kind: 'enemy', unit: e, prio: 0 });
    acts.sort((a, b) => b.prio - a.prio || (this.S(b.unit, 'spd') + rnd() * 4) - (this.S(a.unit, 'spd') + rnd() * 4));
    for (const act of acts) {
      if (this.over) break;
      if (act.unit.hp <= 0) continue;
      this.runAct(act);
      this.checkEnd();
    }
    if (!this.over) { this.endRound(); this.checkEnd(); }
    return this.flush();
  }

  /** ¿Pierde el turno por congelación / aturdimiento? */
  disabled(u) {
    for (const k of ['freeze', 'stun']) {
      if (u.fx[k]) {
        delete u.fx[k];
        this.ev({ t: 'msg', text: `${u.name} está ${k === 'freeze' ? 'congelado' : 'aturdido'} y pierde el turno.`, target: u.uid, status: k });
        if (u.charging) { u.charging = null; this.ev({ t: 'msg', text: `¡Se interrumpe la carga de ${u.name}!`, target: u.uid, interrupt: true }); }
        return true;
      }
    }
    return false;
  }

  runAct(act) {
    const u = act.unit;
    if (act.kind === 'unison') return this.doUnison(act);
    if (this.disabled(u)) return;
    if (act.kind === 'defend') {
      u.defending = true; u.mp = Math.min(u.maxMp, u.mp + 6); u.ult = Math.min(100, u.ult + 6); if (u.side === 'ally') this.bondAdd(3);
      return this.ev({ t: 'defend', actor: u.uid, text: `${u.name} se pone en guardia.`, mp: u.mp, ult: u.ult });
    }
    if (act.kind === 'flee') return this.tryFlee(u);
    if (act.kind === 'item') return this.useItem(u, act);
    if (act.kind === 'enemy') return this.enemyAct(u);
    const tech = Data.tech[act.tech];
    if (!tech) return;
    if (act.kind === 'ult') { if (u.ult < 100 || !u.ultTech) return; u.ult = 0; }
    else { if (u.mp < tech.mpCost) return this.ev({ t: 'msg', text: `${u.name} no tiene PM suficientes.` }); u.mp -= tech.mpCost; u.ult = Math.min(100, u.ult + 5);
      if (u.side === 'ally' && tech.mpCost > 0 && this.alive('enemy').some(e => e.ability === 'camara_eco')) { const d = Math.max(2, Math.round(u.maxHp * 0.04)); u.hp = Math.max(1, u.hp - d); this.ev({ t: 'hit', target: u.uid, dmg: d, dot: 'eco', hp: u.hp, element: 'arcano' }); } }
    if (u.side === 'ally') this.bondAdd(3);
    if (u.side === 'ally' && tech.type === 'attack' && tech.power > 0) this._echo = { u, tech };
    this.doTech(u, tech, this.targetsFor(u, tech, act.target));
  }

  /** Ataque de Unión: golpes de protagonista y Yukine seguidos, sin esquiva, y efectos de grupo. */
  doUnison(act) {
    const sp = this.unison, pr = this.unisonPartners(); if (!sp || !pr || this.bond < 100) return;
    this.bond = 0; this._unionRound = this.round;
    const { p, y } = pr;
    const chosen = this.byUid(act.target);
    const foes = () => this.alive('enemy');
    this.ev({ t: 'act', actor: p.uid, name: sp.name, tech: 'unison_' + sp.classId, classId: sp.classId, element: sp.element, ult: true, unison: true, partner: y.name,
      mp: p.mp, ultv: p.ult, targets: foes().map(t => t.uid) });
    const main = chosen && chosen.hp > 0 && chosen.side === 'enemy' ? chosen : foes()[0];
    for (const h of sp.hits) {
      const actor = h.by === 'y' ? y : p;
      const tech = { type: 'attack', name: sp.name, element: h.element, power: h.power, target: h.target, effect: h.effect || null, noDodge: true };
      const targets = h.target === 'all_enemies' ? foes() : [main.hp > 0 ? main : foes()[0]].filter(Boolean);
      for (const t of targets) { if (this.over) break; if (t.hp > 0) this.hit(actor, tech, t); }
      if (this.over) break;
    }
    if (!this.over && sp.party) {
      for (const a of this.alive('ally')) {
        if (sp.party.heal) { const b = a.hp; a.hp = Math.min(a.maxHp, a.hp + Math.round(a.maxHp * sp.party.heal)); this.ev({ t: 'heal', target: a.uid, amount: a.hp - b, hp: a.hp }); }
        if (sp.party.effect) this.applyFx(a, sp.party.effect, sp.name, true);
      }
    }
    this.checkEnrage();
  }

  targetsFor(u, tech, targetUid) {
    const foes = this.alive(u.side === 'ally' ? 'enemy' : 'ally'), friends = this.alive(u.side);
    switch (tech.target) {
      case 'all_enemies': return foes;
      case 'party': return friends;
      case 'self': return [u];
      case 'ally': { const t = this.byUid(targetUid); return [t && t.hp > 0 && t.side === u.side ? t : u]; }
      default: { const t = this.byUid(targetUid); return [t && t.hp > 0 && t.side !== u.side ? t : foes[0]].filter(Boolean); }
    }
  }

  /* ---------- Turno enemigo ---------- */
  enemyAct(e) {
    const it = e.intent; if (!it) return;
    const s = it.skill;
    if (it.charging) {
      e.charging = s;
      return this.ev({ t: 'charge', actor: e.uid, text: s.chargeText || `¡${e.name} concentra energía!`, name: s.name });
    }
    e.charging = null;
    const tech = { type: s.type || 'attack', name: s.name, element: s.element || 'fisico', power: s.power || 0, target: s.target || 'enemy',
      effect: s.effect || null, stat: s.stat, enemyUlt: !!s.isUlt, ultimate: !!s.isUlt };
    let targets;
    if (tech.target === 'enemy') { const t = this.byUid(it.target); targets = [t && t.hp > 0 ? t : pick(this.alive('ally'))]; }
    else targets = this.targetsFor(e, tech);
    this.doTech(e, tech, targets.filter(Boolean));
    if (e.ability === 'amor_filial' && tech.type === 'attack' && tech.power > 0 && e.hp > 0 && !this.over) {
      this.ev({ t: 'msg', text: `¡Amor filial! ${e.name} golpea de nuevo.`, target: e.uid });
      const second = { ...tech, power: tech.power * 0.2, effect: null, name: tech.name + ' (eco)' };
      for (const t of targets.filter(x => x && x.hp > 0)) { if (this.over) break; this.hit(e, second, t); }
      this.checkEnrage();
    }
  }

  /* ---------- Técnicas ---------- */
  doTech(actor, tech, targets) {
    this.ev({ t: 'act', actor: actor.uid, name: tech.name, tech: tech.id, element: tech.element, ult: !!tech.ultimate, mp: actor.mp, ultv: actor.ult, targets: targets.map(t => t.uid) });
    switch (tech.type) {
      case 'attack': for (const t of targets) { if (this.over) break; this.hit(actor, tech, t); } break;
      case 'heal': for (const t of targets) this.heal(actor, tech, t); break;
      case 'buff': for (const t of targets) this.applyFx(t, tech.effect, `${tech.name}`, true);
        if (actor.side === 'ally') for (const e of this.alive('enemy')) if (e.ability === 'replica') { this.ev({ t: 'msg', text: `¡${e.name} repite tu canción y se potencia igual!`, target: e.uid }); this.applyFx(e, tech.effect, tech.name, true); }
        break;
      case 'debuff': for (const t of targets) this.applyFx(t, tech.effect, `${tech.name}`, false); break;
      case 'utility': if (tech.effect?.mp_restore) { actor.mp = Math.min(actor.maxMp, actor.mp + tech.effect.mp_restore); this.ev({ t: 'mp', target: actor.uid, amount: tech.effect.mp_restore, mp: actor.mp }); } break;
      case 'ultimate': this.transformWolf(actor, tech);
        if (actor.side === 'ally' && this.alive('enemy').some(e => e.ability === 'centella') && actor.hp > 0) { const d = Math.max(3, Math.round(actor.maxHp * 0.15)); actor.hp = Math.max(0, actor.hp - d); this.ev({ t: 'msg', text: '¡Una centella matutina cae sobre quien se transforma!', target: actor.uid }); this.ev({ t: 'hit', target: actor.uid, dmg: d, dot: 'centella', hp: actor.hp, element: 'fuego' }); if (actor.hp <= 0) this.faint(actor); }
        break;
    }
    this.checkEnrage();
  }

  offense(actor, tech) {
    const stat = tech.stat || (tech.element === 'fisico' ? 'atk' : 'mag');
    if (actor.hybrid && stat === 'mag') return (this.S(actor, 'atk') + this.S(actor, 'mag')) / 2;
    if (actor.hybrid && tech.element === 'imbuido') return (this.S(actor, 'atk') + this.S(actor, 'mag')) / 2;
    return this.S(actor, stat);
  }

  dodgeChance(actor, t) {
    const base = 0.03 + (this.S(t, 'spd') - this.S(actor, 'spd')) * 0.01 + (t.dodgeBonus || 0) + (t.fx.dodge_up ? 0.2 : 0) + (t.ability === 'evasion' ? 0.12 : 0) + (t.ability === 'anochecer' ? Math.min(0.3, 0.03 * (this.round - 1)) : 0);
    return clamp(base, 0, 0.5);
  }

  hit(actor, tech, t) {
    if (t.ability === 'ilusion' && !tech.noDodge && this.round % 2 === 1 && t._illRound !== this.round) {
      t._illRound = this.round;
      return this.ev({ t: 'dodge', target: t.uid, text: `¡Ilusión! ${t.name} esquiva el primer ataque.` });
    }
    if (t.ability === 'bruma' && actor.side === 'ally' && !tech.noDodge && rnd() < 0.25) return this.ev({ t: 'dodge', target: t.uid, text: `¡La bruma desvía el golpe contra ${t.name}!` });
    if (!tech.noDodge && actor.ability !== 'sin_sombra' && rnd() < this.dodgeChance(actor, t)) return this.ev({ t: 'dodge', target: t.uid, text: `¡${t.name} esquiva!` });
    const eff = tech.effect || {};
    const raw = tech.power * (this.offense(actor, tech) + actor.level * 1.5) / 25;
    const def = this.S(t, 'def') * (1 - (eff.ignore_def || 0)) * (actor.ability === 'sin_sombra' ? 0.65 : 1);
    let dmg = raw * 30 / (30 + def);
    const weak = t.weak?.includes(tech.element), resist = t.resist?.includes(tech.element);
    if (weak) dmg *= 1.5; if (resist) dmg *= 0.6;
    const crit = !(actor.side === 'ally' && this.alive('enemy').some(e => e.ability === 'contraluz')) && rnd() < 0.06 + (eff.crit_up || 0) + (actor.fx.wolf ? 0.1 : 0);
    if (crit) dmg *= 1.5;
    if (actor.fx.wolf) dmg *= 1.5;
    if (t.defending) dmg *= 0.5;
    if (t.ability === 'dureza') dmg *= 0.85;
    if (t.ability === 'pararrayos' && tech.element === 'rayo') dmg *= 0.25;
    if (actor.ability === 'fases' && this.round % 4 === 3) dmg *= 1.35;
    if (t.ability === 'fases' && this.round % 4 === 1) dmg *= 1.2;
    if (t.ability === 'dia_noche' && actor.side === 'ally') { const day = Math.floor((this.round - 1) / 2) % 2 === 0; const el = tech.element; if (day ? (el === 'fuego' || el === 'arcano') : (el === 'oscuro' || el === 'hielo')) dmg *= 0.15; }
    if (t.ability === 'eterno_retorno') dmg = Math.min(dmg, Math.max(1, t.maxHp * 0.04));
    if (t.ability === 'casco') dmg = Math.min(dmg, Math.max(1, t.maxHp * 0.04));
    if (t.ability === 'archivo' && actor.side === 'ally' && tech.id) { if (actor._lastTech === tech.id) dmg *= 0.6; actor._lastTech = tech.id; }
    if (t.ability === 'cristalizacion' && actor.side === 'ally') { const st = t._cr || 0; dmg *= 1 - 0.03 * st; t._cr = crit ? 0 : Math.min(10, st + 1); }
    if (actor.ability === 'reloj_arena') dmg *= 1 + 0.06 * Math.min(10, Math.max(0, this.round - 1 - (actor._clockReset || 0)));
    if (t.ability === 'sobrecalentamiento' && tech.element === 'hielo') t._heat = Math.max(0, (t._heat || 0) - 2);
    if (t.ability === 'dualidad' && actor.side === 'ally') { const phys = tech.element === 'fisico'; if (this.round % 2 === 1 ? phys : !phys) dmg *= 0.5; }
    if (actor.ability === 'foco' && t.side === 'ally' && t.uid === this._spot) dmg *= 1.4;
    if (t.ability === 'sol_fijo' && actor.side === 'ally' && this.round % 3 === 0) dmg *= 0.3;
    if (t.ability === 'protocolo' && actor.side === 'ally' && this._taboo && tech.element === this._taboo) dmg *= 0.25;
    if (actor.ability === 'siega' && t.side === 'ally' && t.hp < t.maxHp * 0.5) dmg *= 1.4;
    if (t.ability === 'paja' && actor.side === 'ally') { if (tech.element === 'fisico') dmg *= 0.7; else if (tech.element === 'fuego') dmg *= 1.6; }
    if (actor.ability === 'crepusculo' && actor.hp < actor.maxHp * 0.5 && (tech.element === 'oscuro' || tech.element === 'arcano')) dmg *= 1.35;
    if (t.ability === 'mareas') dmg *= this.round % 2 === 1 ? 0.8 : 1.25;
    if (t.ability === 'prisma' && actor.side === 'ally') { if (t._curRound !== this.round) { t._prevEl = t._curEl; t._curRound = this.round; } if (tech.element === t._prevEl) dmg *= 0.6; t._curEl = tech.element; }
    if (t.ability === 'concha' && t._shellRound !== this.round) { t._shellRound = this.round; dmg *= 0.5; }
    if (t.marked && actor.side === 'enemy') dmg *= 1.25;
    if (t.ability === 'velo_nocturno' && tech.element === 'fisico') dmg *= 0.7;
    if (actor.ability === 'sol_radiante' && (tech.element === 'fuego' || tech.element === 'rayo')) dmg *= 1.3;
    if (actor.side === 'ally' && tech.element === 'hielo' && this.alive('enemy').some(e => e.ability === 'sol_radiante')) dmg *= 0.8;
    dmg = Math.max(1, Math.round(dmg * (0.92 + rnd() * 0.16)));
    if (actor.side === 'ally') { this._dmgBy ||= {}; this._dmgBy[actor.uid] = (this._dmgBy[actor.uid] || 0) + dmg; }
    if (t.ability === 'paginas' && actor.side === 'ally') {
      if (t._shield === undefined) t._shield = Math.round(t.maxHp * 0.15);
      if (t._shield > 0) { const ab = Math.min(t._shield, dmg); t._shield -= ab; dmg -= ab; this.ev({ t: 'msg', text: ab >= 1 ? `Las páginas absorben ${ab} de daño${t._shield <= 0 ? '… ¡y se rompen!' : '.'}` : '', target: t.uid }); if (dmg <= 0) dmg = 0; }
    }
    if (t.ability === 'eco_devuelto' && actor.side === 'ally') t._store = (t._store || 0) + dmg;
    t.hp = Math.max(0, t.hp - dmg);
    if (actor.ability === 'cobro' && actor.side === 'enemy' && actor.hp > 0 && dmg > 0) { const h = Math.min(actor.maxHp - actor.hp, Math.round(dmg * 0.25)); if (h > 0) { actor.hp += h; this.ev({ t: 'heal', target: actor.uid, amount: h, hp: actor.hp, regen: true }); } }
    if (t.side === 'ally') { t.ult = Math.min(100, t.ult + (this.alive('enemy').some(e => e.ability === 'silencio') ? 3 : 7)); this.bondAdd(4); }
    this.ev({ t: 'hit', target: t.uid, dmg, crit, weak, resist, hp: t.hp, element: tech.element, guard: !!t.defending });
    if (t.ability === 'espinas' && tech.element === 'fisico' && actor.side === 'ally' && actor.hp > 0) {
      const r = Math.max(1, Math.round(dmg * 0.08)); actor.hp = Math.max(0, actor.hp - r);
      this.ev({ t: 'hit', target: actor.uid, dmg: r, dot: 'espinas', hp: actor.hp, element: 'fisico' });
      if (actor.hp <= 0) this.faint(actor);
    }
    if (t.ability === 'rosal' && crit && actor.side === 'ally' && actor.hp > 0) {
      const r = Math.max(3, Math.round(actor.maxHp * 0.1)); actor.hp = Math.max(0, actor.hp - r);
      this.ev({ t: 'msg', text: `¡Las espinas del rosal hieren a ${actor.name}!`, target: actor.uid });
      this.ev({ t: 'hit', target: actor.uid, dmg: r, dot: 'espinas', hp: actor.hp, element: 'fisico' });
      if (actor.hp <= 0) this.faint(actor);
    }
    if (t.ability === 'pararrayos' && tech.element === 'rayo' && t.hp > 0) { const b = t.hp; t.hp = Math.min(t.maxHp, t.hp + Math.round(t.maxHp * 0.02)); this.ev({ t: 'heal', target: t.uid, amount: t.hp - b, hp: t.hp, regen: true }); }
    if (t.ability === 'espejo' && tech.element !== 'fisico' && actor.side === 'ally' && actor.hp > 0) {
      const r = Math.max(1, Math.round(dmg * 0.2)); actor.hp = Math.max(0, actor.hp - r);
      this.ev({ t: 'hit', target: actor.uid, dmg: r, dot: 'espejo', hp: actor.hp, element: tech.element });
      if (actor.hp <= 0) this.faint(actor);
    }
    if (actor.ability === 'aguijon' && t.side === 'ally' && t.hp > 0 && rnd() < 0.4) this.status(t, 'poison', 3);
    if (actor.ability === 'ancla' && t.side === 'ally' && t.hp > 0 && rnd() < 0.3) this.status(t, 'slow', 2);
    if (t.ability === 'ambar' && tech.element === 'fisico' && actor.side === 'ally' && actor.hp > 0 && rnd() < 0.35) this.status(actor, 'slow', 3);
    if (actor.ability === 'conjuncion' && t.side === 'ally' && tech.target === 'enemy' && dmg > 0) for (const o of this.alive('ally')) if (o !== t) { const d = Math.max(1, Math.round(dmg * 0.2)); o.hp = Math.max(0, o.hp - d); this.ev({ t: 'hit', target: o.uid, dmg: d, dot: 'conjunción', hp: o.hp, element: tech.element }); if (o.hp <= 0) this.faint(o); }
    if (t.hp <= 0 && t.def?.fakeDeath && !t._ret) {
      t._ret = true; t.hp = Math.round(t.maxHp * 0.6); t.fx = { atk_up: 99 }; t.enraged = true; t.charging = null; t.intent = null; this.setAbility(t, 'eterno_retorno'); this.refreshAuras();
      this.ev({ t: 'msg', text: `${t.name} se desploma… y el alba se apaga. Un silencio absoluto cae sobre el palacio.`, target: t.uid });
      for (const ln of (t.def.fakeDeathText || [])) this.ev({ t: 'msg', text: ln, target: t.uid });
      this.ev({ t: 'msg', text: '…Pero el alba siempre vuelve.', target: t.uid });
      this.ev({ t: 'heal', target: t.uid, amount: t.hp, hp: t.hp, regen: true });
      this.ev({ t: 'enrage', target: t.uid, text: `¡${t.name} regresa, más brillante y más furiosa que antes!` }); return;
    }
    if (t.ability === 'contraataque' && actor.side === 'ally' && t.side === 'enemy' && t.hp > 0 && actor.hp > 0 && !tech._counter && rnd() < 0.25) {
      this.ev({ t: 'msg', text: `¡${t.name} responde con un contragolpe!`, target: t.uid });
      this.hit(t, { type: 'attack', name: 'Contragolpe', element: 'fisico', power: 130, target: 'enemy', effect: null, noDodge: true, _counter: true }, actor);
    }
    if (t.hp <= 0 && t.ability === 'rebobinado' && !t._rew) { t._rew = true; t.hp = Math.round(t.maxHp * 0.5); t.fx = {}; this.ev({ t: 'msg', text: `¡El tiempo retrocede! ${t.name} vuelve a un instante anterior.`, target: t.uid }); this.ev({ t: 'heal', target: t.uid, amount: t.hp, hp: t.hp, regen: true }); return; }
    if (t.hp <= 0) return this.faint(t);
    for (const k of ['burn', 'poison', 'slow', 'freeze', 'stun'])
      if (eff[k] && rnd() < eff[k]) this.status(t, k, k === 'freeze' || k === 'stun' ? 1 : 3);
    if (eff.def_down) this.status(t, 'def_down', eff.def_down);
    if (eff.atk_up && actor.side === 'ally') this.status(actor, 'atk_up', eff.atk_up);
  }

  status(t, k, turns) {
    if (t.immune?.includes(k)) return this.ev({ t: 'msg', text: `${t.name} es inmune.`, target: t.uid, immune: true });
    if (t.hp <= 0) return;
    if (t.ability === 'insomnio' && (k === 'stun' || k === 'freeze' || k === 'slow')) {
      const b = t.hp; t.hp = Math.min(t.maxHp, t.hp + Math.round(t.maxHp * 0.03)); this.ev({ t: 'heal', target: t.uid, amount: t.hp - b, hp: t.hp, regen: true });
      return this.ev({ t: 'msg', text: `${t.name} no puede dormirse: es inmune.`, target: t.uid, immune: true });
    }
    if (t.ability === 'reloj_arena' && (k === 'slow' || k === 'stun' || k === 'freeze')) { t._clockReset = this.round - 1; this.ev({ t: 'msg', text: `¡El reloj de arena de ${t.name} se atasca! Su cuenta se reinicia.`, target: t.uid }); }
    if (k === 'freeze' || k === 'stun') { t.fx[k] = 1; if (t.charging) { t.charging = null; this.ev({ t: 'msg', text: `¡Se interrumpe la carga de ${t.name}!`, target: t.uid, interrupt: true }); } }
    else t.fx[k] = Math.max(t.fx[k] || 0, turns);
    this.ev({ t: 'status', target: t.uid, status: k, text: `${STATUS_INFO[k]?.[1] || k}`, fx: { ...t.fx } });
  }

  applyFx(t, effect, name, good) {
    if (!effect) return;
    for (const [k, v] of Object.entries(effect)) this.status(t, k, v);
  }

  heal(actor, tech, t) {
    const revive = t.hp <= 0;
    if (revive) return;
    const off = actor.hybrid ? (this.S(actor, 'atk') + this.S(actor, 'mag')) / 2 : this.S(actor, 'mag');
    let amount = Math.round(tech.power * (off + actor.level * 1.5) / 14);
    if (actor.side === 'ally' && this.alive('enemy').some(e => e.ability === 'voz_robada')) amount = Math.round(amount * 0.5);
    if (actor.side === 'ally' && this.alive('enemy').some(e => e.ability === 'crepusculo' && e.hp < e.maxHp * 0.5)) amount = Math.round(amount * 0.7);
    const before = t.hp; t.hp = Math.min(t.maxHp, t.hp + amount);
    this.ev({ t: 'heal', target: t.uid, amount: t.hp - before, hp: t.hp });
    if (tech.effect?.regen) this.status(t, 'regen', tech.effect.regen);
  }

  /** Aullido Lunar: transformación de Yukine. */
  transformWolf(actor, tech) {
    const eff = tech.effect || {};
    const aw = !!actor.wolfAwakened;
    const bonus = Math.round(actor.maxHp * (aw ? 0.6 : 0.4));
    actor.maxHp += bonus; actor.wolfBonus = (actor.wolfBonus || 0) + bonus;
    actor.hp = Math.min(actor.maxHp, actor.hp + bonus + Math.round(actor.maxHp * (eff.heal || 0.4)));
    actor.fx.wolf = (eff.transform_wolf || 3) + 1 + (aw ? 1 : 0);
    actor.fx.atk_up = actor.fx.wolf;
    this.ev({ t: 'transform', actor: actor.uid, text: `¡${actor.name} aúlla a la luna y se transforma en loba!`, hp: actor.hp, maxHp: actor.maxHp, fx: { ...actor.fx } });
    for (const a of this.alive('ally')) {
      if (a === actor) continue;
      a.fx.atk_up = (eff.transform_wolf || 3) + 1;
      const h = Math.round(a.maxHp * 0.25); const before = a.hp; a.hp = Math.min(a.maxHp, a.hp + h);
      this.ev({ t: 'heal', target: a.uid, amount: a.hp - before, hp: a.hp });
      this.ev({ t: 'status', target: a.uid, status: 'atk_up', text: 'Ataque ↑ (Aullido)', fx: { ...a.fx } });
    }
    // Habilidad «Intimidación» (como en Pokémon): mientras dure la forma de loba, los rivales tienen el ataque bajado.
    if (actor.id === 'yukine') {
      this.ev({ t: 'msg', text: `¡Intimidación de ${actor.name}! El ataque de los rivales baja mientras dure la forma de loba.`, target: actor.uid });
      for (const e of this.alive('enemy')) {
        if (e.immune?.includes('atk_down') || e.immune?.includes('intimidate')) { this.ev({ t: 'msg', text: `${e.name} no se deja intimidar.`, target: e.uid, immune: true }); continue; }
        e.fx.intimidate = 99;
        this.ev({ t: 'status', target: e.uid, status: 'intimidate', text: 'Intimidación', fx: { ...e.fx } });
      }
    }
  }

  /* ---------- Objetos y huida ---------- */
  useItem(u, act) {
    const it = Data.itemById[act.item]; if (!it?.effect) return;
    const t = this.byUid(act.target) || u; const e = it.effect;
    this.ev({ t: 'act', actor: u.uid, name: it.name, element: 'objeto', ult: false, mp: u.mp, ultv: u.ult, targets: [t.uid] });
    if (e.revive) {
      if (t.hp > 0) return this.ev({ t: 'msg', text: 'No surte efecto.' });
      t.hp = Math.max(1, Math.round(t.maxHp * e.revive)); t.fx = {};
      return this.ev({ t: 'revive', target: t.uid, hp: t.hp, text: `¡${t.name} se levanta de nuevo!` });
    }
    if (t.hp <= 0) return this.ev({ t: 'msg', text: 'No surte efecto sobre un aliado debilitado.' });
    if (e.heal || e.healPct) {
      const amt = e.heal || Math.round(t.maxHp * e.healPct); const b = t.hp; t.hp = Math.min(t.maxHp, t.hp + amt);
      this.ev({ t: 'heal', target: t.uid, amount: t.hp - b, hp: t.hp });
    }
    if (e.mp) { t.mp = Math.min(t.maxMp, t.mp + e.mp); this.ev({ t: 'mp', target: t.uid, amount: e.mp, mp: t.mp }); }
  }

  tryFlee(u) {
    if (!this.opts.canFlee) return this.ev({ t: 'msg', text: '¡No puedes huir de este combate!' });
    const a = Math.max(...this.alive('ally').map(x => this.S(x, 'spd'))), b = Math.max(...this.alive('enemy').map(x => this.S(x, 'spd')));
    if (rnd() < clamp(0.55 + (a - b) * 0.03, 0.25, 0.9)) {
      this.ev({ t: 'msg', text: '¡Escapáis del combate!' });
      this.over = true; this.result = 'flee'; this.ev({ t: 'end', result: 'flee' });
    } else this.ev({ t: 'msg', text: '¡No logras escapar!' });
  }

  /* ---------- Fin de ronda / estados ---------- */
  endRound() {
    this.bondAdd(2);
    if (this.alive('enemy').some(e => e.ability === 'aura_brasas')) for (const a of this.alive('ally')) {
      const d = Math.max(3, Math.round(a.maxHp * 0.04)); a.hp = Math.max(0, a.hp - d);
      this.ev({ t: 'hit', target: a.uid, dmg: d, dot: 'brasas', hp: a.hp, element: 'fuego' }); if (a.hp <= 0) this.faint(a);
    }
    for (const e of this.alive('enemy')) if (e.ability === 'regeneracion' && e.hp < e.maxHp) { const b = e.hp; e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * 0.03)); this.ev({ t: 'heal', target: e.uid, amount: e.hp - b, hp: e.hp, regen: true }); }
    for (const e of this.alive('enemy')) {
      if (e.ability === 'sobrecarga') { const al = this.alive('ally'); if (al.length) { const a = pick(al), d = Math.max(3, Math.round(a.maxHp * 0.05)); a.hp = Math.max(0, a.hp - d); this.ev({ t: 'hit', target: a.uid, dmg: d, dot: 'sobrecarga', hp: a.hp, element: 'rayo' }); if (a.hp <= 0) this.faint(a); } }
      if (e.ability === 'plegaria' && this.round % 3 === 0 && e.hp < e.maxHp) { const b = e.hp; e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * 0.08)); this.ev({ t: 'heal', target: e.uid, amount: e.hp - b, hp: e.hp, regen: true }); }
      if (e.ability === 'polen' && this.round % 4 === 0) { const al = this.alive('ally'); if (al.length) { const a = pick(al); this.ev({ t: 'msg', text: `¡El polen de ${e.name} adormece a ${a.name}!`, target: a.uid }); this.status(a, 'stun', 1); } }
      if (e.ability === 'latido' && this.round % 4 === 0) {
        this.ev({ t: 'msg', text: `¡El sol late! Una ola de luz recorre el campo.`, target: e.uid });
        for (const a of this.alive('ally')) { const d = Math.max(3, Math.round(a.maxHp * 0.08 * (a.defending ? 0.5 : 1))); a.hp = Math.max(0, a.hp - d); this.ev({ t: 'hit', target: a.uid, dmg: d, dot: 'latido', hp: a.hp, element: 'fuego' }); if (a.hp <= 0) this.faint(a); }
      }
      if (e.ability === 'nana' && this.round % 3 === 0) {
        this.ev({ t: 'msg', text: `¡${e.name} canta una nana! El cansancio cae sobre tu equipo.`, target: e.uid });
        for (const a of this.alive('ally')) { const lose = Math.round(a.mp * 0.1); a.mp -= lose; a.ult = Math.max(0, a.ult - 10); this.ev({ t: 'mp', target: a.uid, amount: -lose, mp: a.mp }); }
      }
      if (e.ability === 'eco_devuelto' && this.round % 3 === 0 && e._store > 0) {
        this.ev({ t: 'msg', text: `¡El eco de la montaña vuelve! ${e.name} devuelve el daño acumulado.`, target: e.uid });
        for (const a of this.alive('ally')) { const d = Math.max(3, Math.min(Math.round(e._store * 0.12), Math.round(a.maxHp * 0.2))); a.hp = Math.max(0, a.hp - d); this.ev({ t: 'hit', target: a.uid, dmg: d, dot: 'eco', hp: a.hp, element: 'arcano' }); if (a.hp <= 0) this.faint(a); }
        e._store = 0;
      }
      if (e.ability === 'rayo_mudo' && this.round % 3 === 0) {
        const al = this.alive('ally'); if (al.length) { const a = al.reduce((m, x) => x.mp > m.mp ? x : m, al[0]); const d = Math.max(3, Math.round(a.maxHp * 0.12)); const lose = a.mp; a.mp = 0; a.hp = Math.max(0, a.hp - d);
          this.ev({ t: 'msg', text: `¡Un rayo sin trueno cae sobre ${a.name}!`, target: a.uid }); if (lose) this.ev({ t: 'mp', target: a.uid, amount: -lose, mp: 0 }); this.ev({ t: 'hit', target: a.uid, dmg: d, dot: 'rayo mudo', hp: a.hp, element: 'rayo' }); if (a.hp <= 0) this.faint(a); }
      }
      if (e.ability === 'contrapunto' && this.round % 4 === 0 && e.hp > 0 && !this.over) { this.ev({ t: 'msg', text: `¡${e.name} entra a contratiempo con una voz más!`, target: e.uid }); this.enemyAct(e); }
      if (e.ability === 'avalancha' && this.round % 3 === 0) {
        const al = this.alive('ally'); if (al.length) { const a = al.reduce((m, x) => x.hp / x.maxHp < m.hp / m.maxHp ? x : m, al[0]); const d = Math.max(3, Math.round(a.maxHp * 0.15 * (a.defending ? 0.5 : 1))); a.hp = Math.max(0, a.hp - d);
          this.ev({ t: 'msg', text: `¡Una avalancha de roca cae sobre ${a.name}!`, target: a.uid }); this.ev({ t: 'hit', target: a.uid, dmg: d, dot: 'avalancha', hp: a.hp, element: 'fisico' }); if (a.hp <= 0) this.faint(a); }
      }
      if (e.ability === 'reverberacion' && this._echo && this._echo.u.hp > 0 && e.hp > 0 && !this.over) {
        const { u, tech } = this._echo; this._echo = null;
        this.ev({ t: 'msg', text: `¡El eco de ${e.name} te devuelve tu propio golpe, ${u.name}!`, target: u.uid });
        this.hit(e, { type: 'attack', name: 'Reverberación', element: tech.element, power: Math.round(tech.power * 0.5), target: 'enemy', effect: null, noDodge: true }, u);
      }
      if (e.ability === 'ventisca_callada') for (const a of this.alive('ally')) if (rnd() < 0.25) { this.ev({ t: 'msg', text: `La ventisca ralentiza a ${a.name}.`, target: a.uid }); this.status(a, 'slow', 2); }
      if (e.ability === 'sobrecalentamiento') {
        e._heat = (e._heat || 0) + 1;
        if (e._heat === 4) this.ev({ t: 'msg', text: `¡${e.name} echa humo! Está a punto de estallar. ¡Defiéndete o enfríala con hielo!`, target: e.uid });
        if (e._heat >= 5) { e._heat = 0; this.ev({ t: 'msg', text: `¡${e.name} libera todo su calor!`, target: e.uid });
          for (const a of this.alive('ally')) { const d = Math.max(3, Math.round(a.maxHp * 0.18 * (a.defending ? 0.5 : 1))); a.hp = Math.max(0, a.hp - d); this.ev({ t: 'hit', target: a.uid, dmg: d, dot: 'calor', hp: a.hp, element: 'fuego' }); if (a.hp <= 0) this.faint(a); } }
      }
      if (e.ability === 'paginas' && this.round % 4 === 0 && (e._shield || 0) <= 0) { e._shield = Math.round(e.maxHp * 0.15); this.ev({ t: 'msg', text: `¡${e.name} se rodea de páginas nuevas!`, target: e.uid }); }
      if (e.ability === 'olvido') for (const a of this.alive('ally')) if (rnd() < 0.15) { this.ev({ t: 'msg', text: `${a.name} olvida qué estaba haciendo.`, target: a.uid }); this.status(a, 'stun', 1); }
      if (e.ability === 'foco' && this._dmgBy) { let best = null, bv = 0; for (const a of this.alive('ally')) if ((this._dmgBy[a.uid] || 0) > bv) { bv = this._dmgBy[a.uid]; best = a; } this._dmgBy = {}; this._spot = best ? best.uid : null; if (best) this.ev({ t: 'msg', text: `¡El foco de escena apunta a ${best.name}!`, target: best.uid }); }
      if (e.ability === 'sol_fijo' && this.round % 3 === 2) this.ev({ t: 'msg', text: `¡El sol se queda quieto sobre ${e.name}! La próxima ronda será casi invulnerable.`, target: e.uid });
      if (e.ability === 'protocolo') { const els = ['fuego', 'hielo', 'rayo', 'arcano', 'fisico']; const nm = { fuego: 'fuego', hielo: 'hielo', rayo: 'rayo', arcano: 'arcano', fisico: 'físico' }; this._taboo = els[Math.floor(rnd() * els.length)]; this.ev({ t: 'msg', text: `${e.name} decreta: «Queda prohibido el elemento ${nm[this._taboo]}».`, target: e.uid }); }
      if (e.ability === 'ultima_palabra' && e.hp > 0 && e.hp < e.maxHp * 0.25 && !this.over) { this.ev({ t: 'msg', text: `¡${e.name} se niega a dejar de escribir y ataca otra vez!`, target: e.uid }); this.enemyAct(e); }
      if (e.ability === 'succion') {
        let n = 0; for (const a of this.alive('ally')) { const lose = Math.min(a.mp, Math.round(a.maxMp * 0.06)); if (lose > 0) { a.mp -= lose; n++; this.ev({ t: 'mp', target: a.uid, amount: -lose, mp: a.mp }); } }
        if (n && e.hp < e.maxHp) { const b = e.hp; e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * 0.008 * n)); this.ev({ t: 'heal', target: e.uid, amount: e.hp - b, hp: e.hp, regen: true }); }
      }
      if (e.ability === 'fases') { const nx = (this.round + 1) % 4; this.ev({ t: 'msg', text: ['La luna mengua.', 'Luna nueva: la loba queda al descubierto.', 'La luna crece.', 'Luna llena: su ataque se dispara. ¡Cuidado!'][nx], target: e.uid }); }
      if (e.ability === 'mareas') {
        if (this.round % 2 === 1 && e.hp < e.maxHp) { const b = e.hp; e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * 0.03)); this.ev({ t: 'heal', target: e.uid, amount: e.hp - b, hp: e.hp, regen: true }); }
        this.ev({ t: 'msg', text: this.round % 2 === 1 ? `La marea baja: ${e.name} queda al descubierto.` : `La marea sube: ${e.name} se hace fuerte.`, target: e.uid });
      }
      if (e.ability === 'tsunami') {
        if (this.round % 4 === 3) this.ev({ t: 'msg', text: `¡El agua se retira con un rugido! ¡Viene una ola enorme: defiéndete!`, target: e.uid });
        if (this.round % 4 === 0) {
          this.ev({ t: 'msg', text: `¡La ola de ${e.name} rompe sobre tu equipo!`, target: e.uid });
          for (const a of this.alive('ally')) { if (a.defending) { this.ev({ t: 'msg', text: `${a.name} aguanta la ola.`, target: a.uid }); continue; } const d = Math.max(3, Math.round(a.maxHp * 0.18)); a.hp = Math.max(0, a.hp - d); this.ev({ t: 'hit', target: a.uid, dmg: d, dot: 'tsunami', hp: a.hp, element: 'hielo' }); if (a.hp <= 0) this.faint(a); }
        }
      }
      if (e.ability === 'aullido' && this.round % 3 === 0) { this.ev({ t: 'msg', text: `¡${e.name} aúlla a la luna ausente!`, target: e.uid }); this.status(e, 'atk_up', 3); }
      if (e.ability === 'marca') {
        for (const a of this.allies) a.marked = false;
        const al = this.alive('ally'); if (al.length) { const a = pick(al); a.marked = true; this.ev({ t: 'msg', text: `¡El haz del faro marca a ${a.name}! Recibirá un 25 % más de daño.`, target: a.uid }); }
      }
      if (e.ability === 'panico') {
        if (e.hp < e.maxHp * 0.75 && e.fx.atk_up !== 99) { e.fx.atk_up = 99; this.ev({ t: 'status', target: e.uid, status: 'atk_up', text: 'Pánico', fx: { ...e.fx } }); }
        if (e.hp < e.maxHp * 0.5 && e.fx.spd_up !== 99) { e.fx.spd_up = 99; this.ev({ t: 'status', target: e.uid, status: 'spd_up', text: 'Pánico', fx: { ...e.fx } }); }
      }
      if (e.ability === 'dia_noche' && this.round % 2 === 0) { const nextDay = Math.floor(this.round / 2) % 2 === 0; this.ev({ t: 'msg', text: nextDay ? '¡Amanece de golpe! Es de Día: el fuego y lo arcano apenas la dañan.' : '¡Cae la Noche! Lo oscuro y el hielo apenas la dañan.', target: e.uid }); }
      if (e.ability === 'eterno_retorno' && this.round % 5 === 0 && e.hp > 0) {
        if (this._unionRound === this.round) this.ev({ t: 'msg', text: '¡La Unión interrumpe el Eterno Retorno!', target: e.uid });
        else if (!this._nightHelp && State.game?.flags?.cave_m1_done) { this._nightHelp = true; this.ev({ t: 'msg', text: '¡La Primera Noche acude en vuestra ayuda! Su «Aliento de Noche» ahoga el Eterno Retorno una ronda.', target: e.uid }); }
        else {
          const b = e.hp; e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * 0.05));
          this.ev({ t: 'msg', text: `¡${e.name} invoca el Eterno Retorno! Todo vuelve a empezar: tus mejoras se borran.`, target: e.uid }); this.ev({ t: 'heal', target: e.uid, amount: e.hp - b, hp: e.hp, regen: true });
          for (const a of this.alive('ally')) { let ch = false; for (const k of ['atk_up', 'def_up', 'spd_up', 'dodge_up', 'regen', 'crit_up']) if (a.fx[k]) { delete a.fx[k]; ch = true; } if (ch) this.ev({ t: 'fxclear', target: a.uid, fx: { ...a.fx } }); }
        }
      }
      if (e.ability === 'tiempo_detenido' && this.round % 3 === 0) {
        this.ev({ t: 'msg', text: `¡${e.name} detiene el tiempo! Las mejoras de tu equipo se desvanecen.`, target: e.uid });
        for (const a of this.alive('ally')) { let ch = false; for (const k of ['atk_up', 'def_up', 'spd_up', 'dodge_up', 'regen']) if (a.fx[k]) { delete a.fx[k]; ch = true; } if (ch) this.ev({ t: 'fxclear', target: a.uid, fx: { ...a.fx } }); }
      }
    }
    for (const u of this.all) {
      if (u.hp <= 0) continue;
      for (const k of ['burn', 'poison']) if (u.fx[k]) {
        const d = Math.max(3, Math.round(u.maxHp * (k === 'burn' ? 0.06 : 0.05)));
        u.hp = Math.max(0, u.hp - d);
        this.ev({ t: 'hit', target: u.uid, dmg: d, dot: k, hp: u.hp, element: k === 'burn' ? 'fuego' : 'veneno' });
        if (u.hp <= 0) { this.faint(u); break; }
      }
      if (u.hp <= 0) continue;
      const regen = (u.fx.regen ? 0.06 : 0) + (u.fx.wolf ? (u.wolfAwakened ? 0.12 : 0.08) : 0);
      if (regen) { const b = u.hp; u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * regen)); if (u.hp > b) this.ev({ t: 'heal', target: u.uid, amount: u.hp - b, hp: u.hp, regen: true }); }
      for (const k of Object.keys(u.fx)) {
        if (k === 'freeze' || k === 'stun' || u.fx[k] >= 99) continue;
        if (--u.fx[k] <= 0) {
          delete u.fx[k];
          if (k === 'wolf') this.endWolf(u);
        }
      }
      if (u.side === 'ally') { u.mp = Math.min(u.maxMp, u.mp + 4); u.ult = Math.min(100, u.ult + 3 + (u.ultGain || 0)); }
    }
    this.ev({ t: 'tick' });
  }

  clearIntimidate() {
    for (const e of this.all) if (e.fx.intimidate) { delete e.fx.intimidate; this.ev({ t: 'fxclear', target: e.uid, fx: { ...e.fx } }); }
  }

  endWolf(u) {
    this.clearIntimidate();
    if (u.wolfBonus) { u.maxHp -= u.wolfBonus; u.wolfBonus = 0; u.hp = Math.max(1, Math.min(u.hp, u.maxHp)); }
    this.ev({ t: 'unwolf', actor: u.uid, text: `${u.name} recupera su forma humana.`, hp: u.hp, maxHp: u.maxHp });
  }

  faint(t) {
    const hadWolf = !!t.fx.wolf;
    if (t.side === 'ally') for (const e of this.alive('enemy')) if (e.ability === 'cosecha') { const b = e.hp; e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * 0.15)); this.ev({ t: 'msg', text: `¡${e.name} cosecha lo caído!`, target: e.uid }); this.ev({ t: 'heal', target: e.uid, amount: e.hp - b, hp: e.hp, regen: true }); }
    t.fx = {}; t.charging = null; t.intent = null;
    if (t.side === 'enemy') this.defeated.push(t);
    if (t.wolfBonus) { t.maxHp -= t.wolfBonus; t.wolfBonus = 0; }
    if (hadWolf) this.clearIntimidate();
    if (t.side === 'enemy') this.refreshAuras();
    if (t.side === 'ally') for (const e of this.alive('enemy')) if (e.ability === 'duelo' && !(e.fx.atk_up === 99 && e.fx.spd_up === 99)) {
      e.fx.atk_up = 99; e.fx.spd_up = 99; this.ev({ t: 'status', target: e.uid, status: 'atk_up', text: 'Duelo', fx: { ...e.fx } });
    }
    this.ev({ t: 'faint', target: t.uid, text: t.side === 'ally' ? `¡${t.name} queda debilitado!` : `${t.name} es derrotado.` });
  }

  checkEnrage() {
    for (const e of this.alive('enemy')) {
      const en = e.def.enrage;
      if (en && !e.enraged && e.hp / e.maxHp <= en.hp) {
        e.enraged = true; e.fx.atk_up = 99;
        this.ev({ t: 'enrage', target: e.uid, text: en.text });
        if (e.def.enrageAbility && ABILITIES[e.def.enrageAbility]) {
          this.setAbility(e, e.def.enrageAbility);
          this.ev({ t: 'msg', text: `¡${e.name} cambia de habilidad! Ahora: «${ABILITIES[e.ability][0]}». ${ABILITIES[e.ability][1]}`, target: e.uid });
          this.refreshAuras();
        }
      }
    }
  }

  checkEnd() {
    if (this.over) return;
    if (!this.alive('enemy').length) { this.over = true; this.result = 'win'; this.ev({ t: 'end', result: 'win' }); }
    else if (!this.alive('ally').length) { this.over = true; this.result = 'lose'; this.ev({ t: 'end', result: 'lose' }); }
  }

  /** Recompensas al ganar. */
  rewards() {
    let xp = 0, gold = 0, lvSum = 0; const loot = [];
    for (const e of this.enemies) {
      xp += e.def.xp || 0; gold += e.def.gold || 0; lvSum += e.def.level || 1;
      for (const l of e.def.loot || []) if (rnd() < l.chance) { const li = rollItem(l.item); if (li) loot.push(li); }
    }
    return { xp, gold, loot, avgLevel: Math.round(lvSum / Math.max(1, this.enemies.length)), kills: this.enemies.map(e => e.id) };
  }
}
